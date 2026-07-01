const jwt = require('jsonwebtoken')

const SECRET = process.env.JWT_SECRET
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d'

if (!SECRET) {
  console.warn('⚠️  JWT_SECRET is not set in .env — using an insecure fallback. Set it before deploying.')
}

const signToken = (payload) =>
  jwt.sign(payload, SECRET || 'insecure_dev_secret', { expiresIn: EXPIRES_IN })

const verifyToken = (token) =>
  jwt.verify(token, SECRET || 'insecure_dev_secret')

module.exports = { signToken, verifyToken }
