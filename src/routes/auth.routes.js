const express = require('express')
const router = express.Router()
const ctrl = require('../controllers/auth.controller')
const { authenticate } = require('../middleware/auth')

router.post('/login', ctrl.login)
router.post('/forgot-password', ctrl.forgotPassword)
router.post('/reset-password', ctrl.resetPassword)
router.post('/change-password', authenticate, ctrl.changePassword)
router.post('/logout', authenticate, ctrl.logout)
router.post('/refresh-token', authenticate, ctrl.refreshToken)

module.exports = router
