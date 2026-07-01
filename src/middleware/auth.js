const { verifyToken } = require('../utils/jwt')

// Verifies the Bearer token and attaches { id, userType, name } to req.user.
// Sends 401 on any missing/invalid/expired token — the frontend's Axios
// response interceptor automatically logs the user out on 401.
const authenticate = (req, res, next) => {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null

  if (!token) {
    return res.status(401).json({ success: false, message: 'No token provided.' })
  }

  try {
    const decoded = verifyToken(token)
    req.user = decoded
    next()
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired session. Please log in again.' })
  }
}

// Restricts a route to a set of user types, e.g. authorize('counsellor')
const authorize = (...allowedRoles) => (req, res, next) => {
  if (!req.user || !allowedRoles.includes(req.user.userType)) {
    return res.status(403).json({ success: false, message: 'You do not have permission to access this resource.' })
  }
  next()
}

module.exports = { authenticate, authorize }
