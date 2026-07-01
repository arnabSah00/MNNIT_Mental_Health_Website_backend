const { query } = require('../config/db')
const { asyncHandler } = require('../middleware/errorHandler')

// Shape returned to the frontend's bookerAPI (fields the dashboard tables read)
const APPT_SELECT = `
  SELECT
    a.request_id,
    a.appointment_date,
    a.time_slot,
    a.description,
    a.status,
    a.action_performed,
    a.resolution,
    u.name AS student_name,
    u.identifier AS registration_number,
    u.branch,
    c.name AS counsellor_name
  FROM appointments a
  JOIN users u ON u.id = a.booker_id
  LEFT JOIN users c ON c.id = a.counsellor_id
`

// GET /appointments/profile
const getProfile = asyncHandler(async (req, res) => {
  const { rows } = await query(
    'SELECT id, name, email, identifier AS registration_number, branch, user_type FROM users WHERE id = $1',
    [req.user.id]
  )
  res.json({ success: true, data: rows[0] })
})

// POST /appointments   body: { appointment_date, time_slot, description }
const bookAppointment = asyncHandler(async (req, res) => {
  const { appointment_date, time_slot, description } = req.body
  if (!appointment_date || !time_slot) {
    return res.status(400).json({ success: false, message: 'Please select date and time slot.' })
  }

  // Prevent double-booking the same slot on the same day (any booker, since one counsellor pool)
  const clash = await query(
    `SELECT 1 FROM appointments
     WHERE appointment_date = $1 AND time_slot = $2 AND booker_id = $3 AND status IN ('PENDING','APPROVED')`,
    [appointment_date, time_slot, req.user.id]
  )
  if (clash.rows.length > 0) {
    return res.status(409).json({ success: false, message: 'You already have a request for that date/time.' })
  }

  const { rows } = await query(
    `INSERT INTO appointments (booker_id, appointment_date, time_slot, description, status)
     VALUES ($1, $2, $3, $4, 'PENDING') RETURNING request_id`,
    [req.user.id, appointment_date, time_slot, description || null]
  )

  res.status(201).json({ success: true, message: 'Appointment booked successfully!', request_id: rows[0].request_id })
})

// GET /appointments  — only the logged-in user's own appointments
const getAppointments = asyncHandler(async (req, res) => {
  const { rows } = await query(
    `${APPT_SELECT} WHERE a.booker_id = $1 ORDER BY a.appointment_date DESC, a.request_id DESC`,
    [req.user.id]
  )
  res.json({ success: true, data: rows })
})

// GET /appointments/:id
const getAppointmentById = asyncHandler(async (req, res) => {
  const { rows } = await query(`${APPT_SELECT} WHERE a.request_id = $1 AND a.booker_id = $2`, [req.params.id, req.user.id])
  if (!rows[0]) return res.status(404).json({ success: false, message: 'Appointment not found.' })
  res.json({ success: true, data: rows[0] })
})

// PUT /appointments/:id/cancel — only the owner, only while PENDING
const cancelAppointment = asyncHandler(async (req, res) => {
  const { rows } = await query(
    `UPDATE appointments SET status = 'REJECTED', updated_at = now()
     WHERE request_id = $1 AND booker_id = $2 AND status = 'PENDING'
     RETURNING request_id`,
    [req.params.id, req.user.id]
  )
  if (!rows[0]) {
    return res.status(400).json({ success: false, message: 'Could not cancel. Try again.' })
  }
  res.json({ success: true, message: 'Appointment cancelled.' })
})

module.exports = { getProfile, bookAppointment, getAppointments, getAppointmentById, cancelAppointment }
