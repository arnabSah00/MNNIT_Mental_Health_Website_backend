const { query } = require('../config/db')
const { asyncHandler } = require('../middleware/errorHandler')

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

// GET /counsellor/profile
const getProfile = asyncHandler(async (req, res) => {
  const { rows } = await query('SELECT id, name, email, user_type FROM users WHERE id = $1', [req.user.id])
  res.json({ success: true, data: rows[0] })
})

// PUT /counsellor/profile   body: { name, email, ... }
const updateProfile = asyncHandler(async (req, res) => {
  const { name, email } = req.body
  const { rows } = await query(
    'UPDATE users SET name = COALESCE($1, name), email = COALESCE($2, email), updated_at = now() WHERE id = $3 RETURNING id, name, email',
    [name, email, req.user.id]
  )
  res.json({ success: true, data: rows[0] })
})

// GET /counsellor/appointments/pending  — unassigned or assigned-to-me pending requests
const getPendingRequests = asyncHandler(async (req, res) => {
  const { rows } = await query(
    `${APPT_SELECT} WHERE a.status = 'PENDING' AND (a.counsellor_id IS NULL OR a.counsellor_id = $1)
     ORDER BY a.appointment_date ASC`,
    [req.user.id]
  )
  res.json({ success: true, data: rows })
})

// GET /counsellor/appointments/solved  — everything this counsellor has actioned
const getSolvedRequests = asyncHandler(async (req, res) => {
  const { rows } = await query(
    `${APPT_SELECT} WHERE a.counsellor_id = $1 AND a.status IN ('COMPLETED','REJECTED','APPROVED')
     ORDER BY a.appointment_date DESC`,
    [req.user.id]
  )
  res.json({ success: true, data: rows })
})

// GET /counsellor/appointments/:id
const getAppointmentById = asyncHandler(async (req, res) => {
  const { rows } = await query(`${APPT_SELECT} WHERE a.request_id = $1`, [req.params.id])
  if (!rows[0]) return res.status(404).json({ success: false, message: 'Appointment not found.' })
  res.json({ success: true, data: rows[0] })
})

// PUT /counsellor/appointments/:id   body: { status: 'APPROVED' | 'REJECTED' }
// Used for the Accept / Reject buttons.
const updateAppointment = asyncHandler(async (req, res) => {
  const { status } = req.body
  if (!['APPROVED', 'REJECTED'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status.' })
  }

  const { rows } = await query(
    `UPDATE appointments SET status = $1, counsellor_id = $2, updated_at = now()
     WHERE request_id = $3 AND status = 'PENDING' RETURNING request_id`,
    [status, req.user.id, req.params.id]
  )
  if (!rows[0]) return res.status(400).json({ success: false, message: 'Failed to update. Try again.' })

  res.json({ success: true, message: status === 'APPROVED' ? 'Request approved! Student has been notified.' : 'Request rejected.' })
})

// POST /counsellor/appointments/:id/confirm   body: { action_performed, status } (Complete Session modal)
const confirmBooking = asyncHandler(async (req, res) => {
  const { action_performed, status } = req.body
  if (!action_performed || !action_performed.trim()) {
    return res.status(400).json({ success: false, message: 'Please add session notes.' })
  }
  const resolution = ['RESOLVED', 'FOLLOW_UP', 'REFERRED'].includes(status) ? status : 'RESOLVED'

  const { rows } = await query(
    `UPDATE appointments
     SET status = 'COMPLETED', resolution = $1, action_performed = $2, counsellor_id = $3, updated_at = now()
     WHERE request_id = $4 RETURNING request_id`,
    [resolution, action_performed, req.user.id, req.params.id]
  )
  if (!rows[0]) return res.status(400).json({ success: false, message: 'Failed to complete. Try again.' })

  res.json({ success: true, message: 'Session marked as completed!' })
})

module.exports = { getProfile, updateProfile, getPendingRequests, getSolvedRequests, getAppointmentById, updateAppointment, confirmBooking }
