const express = require('express')
const router = express.Router()
const ctrl = require('../controllers/counsellor.controller')
const { authenticate, authorize } = require('../middleware/auth')

router.use(authenticate, authorize('counsellor'))

router.get('/profile', ctrl.getProfile)
router.put('/profile', ctrl.updateProfile)
router.get('/appointments/pending', ctrl.getPendingRequests)
router.get('/appointments/solved', ctrl.getSolvedRequests)
router.get('/appointments/:id', ctrl.getAppointmentById)
router.put('/appointments/:id', ctrl.updateAppointment)
router.post('/appointments/:id/confirm', ctrl.confirmBooking)

module.exports = router
