// Catches anything passed to next(err) or thrown inside an async route
// wrapped with the asyncHandler below, and returns { success, message }
// so it matches what the frontend's error handling (err.response.data.message) expects.
const errorHandler = (err, req, res, next) => {
  console.error(err)
  const status = err.status || 500
  res.status(status).json({
    success: false,
    message: err.message || 'Server error. Please try again later.'
  })
}

// Wrap async route handlers so thrown errors reach errorHandler
// instead of crashing the process.
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)

module.exports = { errorHandler, asyncHandler }
