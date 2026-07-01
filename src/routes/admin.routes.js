const express = require('express')
const router = express.Router()
const ctrl = require('../controllers/admin.controller')
const { authenticate, authorize } = require('../middleware/auth')

router.use(authenticate, authorize('administrator'))

router.get('/appointments/search', ctrl.searchByRegNo) // must come before /:id
router.get('/appointments/:id', ctrl.getRequestById)
router.get('/appointments', ctrl.getAllRequests)
router.get('/statistics', ctrl.getStatistics)
router.get('/export', ctrl.exportData)

module.exports = router
