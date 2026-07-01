const { query } = require('../config/db')
const { asyncHandler } = require('../middleware/errorHandler')

const APPT_SELECT = `
  SELECT
    a.request_id,
    a.appointment_date,
    a.time_slot,
    a.description,
    a.status AS request_status,
    a.action_performed,
    a.resolution,
    a.prescription,
    u.name AS booker_name,
    u.identifier AS registration_number,
    u.user_type AS booker_type,
    u.email AS booker_email,
    u.branch,
    c.name AS counsellor_name
  FROM appointments a
  JOIN users u ON u.id = a.booker_id
  LEFT JOIN users c ON c.id = a.counsellor_id
`

// GET /admin/appointments?status=PENDING
const getAllRequests = asyncHandler(async (req, res) => {
  const { status } = req.query
  const params = []
  let sql = APPT_SELECT
  if (status) {
    params.push(status)
    sql += ` WHERE a.status = $${params.length}`
  }
  sql += ' ORDER BY a.appointment_date DESC'

  const { rows } = await query(sql, params)
  res.json({ success: true, data: rows })
})

// GET /admin/appointments/:id
const getRequestById = asyncHandler(async (req, res) => {
  const { rows } = await query(`${APPT_SELECT} WHERE a.request_id = $1`, [req.params.id])
  if (!rows[0]) return res.status(404).json({ success: false, message: 'Not found.' })
  res.json({ success: true, data: rows[0] })
})

// GET /admin/appointments/search?regNo=20BCS001
const searchByRegNo = asyncHandler(async (req, res) => {
  const { regNo } = req.query
  if (!regNo) return res.status(400).json({ success: false, message: 'regNo query param is required.' })

  const { rows } = await query(`${APPT_SELECT} WHERE u.identifier ILIKE $1 ORDER BY a.appointment_date DESC`, [`%${regNo}%`])
  res.json({ success: true, data: rows })
})

// GET /admin/statistics
const getStatistics = asyncHandler(async (req, res) => {
  const totals = await query(`
    SELECT
      COUNT(*) FILTER (WHERE true)                    AS "totalRequests",
      COUNT(*) FILTER (WHERE status = 'PENDING')       AS "pendingRequests",
      COUNT(*) FILTER (WHERE status = 'COMPLETED')     AS "completedRequests"
    FROM appointments
  `)
  const students = await query(`SELECT COUNT(*) AS count FROM users WHERE user_type = 'student'`)

  const row = totals.rows[0]
  res.json({
    success: true,
    data: {
      totalRequests: Number(row.totalRequests),
      pendingRequests: Number(row.pendingRequests),
      completedRequests: Number(row.completedRequests),
      totalStudents: Number(students.rows[0].count)
    }
  })
})

// GET /admin/export?format=csv
const exportData = asyncHandler(async (req, res) => {
  const format = req.query.format || 'csv'
  const { rows } = await query(`${APPT_SELECT} ORDER BY a.appointment_date DESC`)

  if (format !== 'csv') {
    return res.json({ success: true, data: rows })
  }

  const header = ['request_id', 'booker_name', 'booker_type', 'registration_number', 'branch', 'appointment_date', 'time_slot', 'counsellor_name', 'request_status']
  const csvLines = [header.join(',')]
  for (const r of rows) {
    csvLines.push(header.map((h) => `"${(r[h] ?? '').toString().replace(/"/g, '""')}"`).join(','))
  }

  res.setHeader('Content-Type', 'text/csv')
  res.setHeader('Content-Disposition', 'attachment; filename="appointments.csv"')
  res.send(csvLines.join('\n'))
})

module.exports = { getAllRequests, getRequestById, searchByRegNo, getStatistics, exportData }
