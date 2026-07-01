require('dotenv').config()
const express = require('express')
const cors = require('cors')

const { errorHandler } = require('./middleware/errorHandler')

const authRoutes = require('./routes/auth.routes')
const appointmentsRoutes = require('./routes/appointments.routes')
const counsellorRoutes = require('./routes/counsellor.routes')
const adminRoutes = require('./routes/admin.routes')
const deanRoutes = require('./routes/dean.routes')
const publicRoutes = require('./routes/public.routes')

const app = express()

app.use(cors({ origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173', credentials: true }))
app.use(express.json())

app.get('/api/health', (req, res) => res.json({ success: true, message: 'API is running' }))

// These paths mirror exactly what src/services/api.js on the frontend calls —
// no frontend changes are needed as long as VITE_API_URL points at /api here.
app.use('/api/auth', authRoutes)
app.use('/api/appointments', appointmentsRoutes)
app.use('/api/counsellor', counsellorRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/dean', deanRoutes)
app.use('/api/public', publicRoutes)

app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found.' }))
app.use(errorHandler)

module.exports = app
