const { query } = require('../config/db')
const { asyncHandler } = require('../middleware/errorHandler')

// GET /dean/statistics
const getRequestStats = asyncHandler(async (req, res) => {
  const totals = await query(`
    SELECT
      COUNT(*) FILTER (WHERE true)                  AS "totalRequests",
      COUNT(*) FILTER (WHERE status = 'PENDING')    AS "pendingRequests",
      COUNT(*) FILTER (WHERE status = 'APPROVED')   AS "approvedRequests",
      COUNT(*) FILTER (WHERE status = 'COMPLETED')  AS "completedRequests",
      COUNT(*) FILTER (WHERE status = 'REJECTED')   AS "rejectedRequests"
    FROM appointments
  `)
  const students = await query(`SELECT COUNT(*) AS count FROM users WHERE user_type = 'student'`)
  const counsellors = await query(`SELECT COUNT(*) AS count FROM users WHERE user_type = 'counsellor'`)

  const row = totals.rows[0]
  res.json({
    success: true,
    data: {
      totalRequests: Number(row.totalRequests),
      pendingRequests: Number(row.pendingRequests),
      approvedRequests: Number(row.approvedRequests),
      completedRequests: Number(row.completedRequests),
      rejectedRequests: Number(row.rejectedRequests),
      totalStudents: Number(students.rows[0].count),
      totalCounsellors: Number(counsellors.rows[0].count)
    }
  })
})

// GET /dean/analytics  -> { byBranch, byStatus }
const getDashboardAnalytics = asyncHandler(async (req, res) => {
  const byBranch = await query(`
    SELECT COALESCE(u.branch, 'Unspecified') AS branch, COUNT(*) AS count
    FROM appointments a JOIN users u ON u.id = a.booker_id
    GROUP BY u.branch ORDER BY count DESC
  `)
  const byStatus = await query(`
    SELECT status, COUNT(*) AS count FROM appointments GROUP BY status
  `)

  res.json({
    success: true,
    data: {
      byBranch: byBranch.rows,
      byStatus: byStatus.rows
    }
  })
})

// GET /dean/trends?period=week|month|year
const getTrends = asyncHandler(async (req, res) => {
  const period = req.query.period || 'month'

  let sql
  if (period === 'week') {
    sql = `
      SELECT to_char(date_trunc('week', appointment_date), 'DD Mon') AS label, COUNT(*) AS count
      FROM appointments
      WHERE appointment_date >= CURRENT_DATE - INTERVAL '12 weeks'
      GROUP BY 1, date_trunc('week', appointment_date)
      ORDER BY date_trunc('week', appointment_date)
    `
  } else if (period === 'year') {
    sql = `
      SELECT to_char(date_trunc('year', appointment_date), 'YYYY') AS label, COUNT(*) AS count
      FROM appointments
      WHERE appointment_date >= CURRENT_DATE - INTERVAL '5 years'
      GROUP BY 1, date_trunc('year', appointment_date)
      ORDER BY date_trunc('year', appointment_date)
    `
  } else {
    sql = `
      SELECT to_char(date_trunc('month', appointment_date), 'Mon YYYY') AS label, COUNT(*) AS count
      FROM appointments
      WHERE appointment_date >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY 1, date_trunc('month', appointment_date)
      ORDER BY date_trunc('month', appointment_date)
    `
  }

  const { rows } = await query(sql)
  res.json({ success: true, data: rows })
})

// GET /dean/report?startDate=&endDate=
const generateReport = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query
  if (!startDate || !endDate) {
    return res.status(400).json({ success: false, message: 'startDate and endDate are required.' })
  }

  const { rows } = await query(
    `SELECT a.request_id, a.appointment_date, a.status, u.branch
     FROM appointments a JOIN users u ON u.id = a.booker_id
     WHERE a.appointment_date BETWEEN $1 AND $2
     ORDER BY a.appointment_date`,
    [startDate, endDate]
  )

  res.json({ success: true, data: rows })
})

module.exports = { getRequestStats, getDashboardAnalytics, getTrends, generateReport }
