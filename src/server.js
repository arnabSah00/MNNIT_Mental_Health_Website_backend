require('dotenv').config()
const app = require('./app')
const { pool } = require('./config/db')

const PORT = process.env.PORT || 5000

// Fail fast with a clear message if PostgreSQL isn't reachable.
pool.query('SELECT 1')
  .then(() => {
    app.listen(PORT, () => {
      console.log(`✅ Connected to PostgreSQL`)
      console.log(`🚀 MHC backend running at http://localhost:${PORT}/api`)
    })
  })
  .catch((err) => {
    console.error('❌ Could not connect to PostgreSQL. Check your .env DB settings.')
    console.error(err.message)
    process.exit(1)
  })
