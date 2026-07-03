// ---------------------------------------------------------------------------
// DATABASE CONNECTION — this is the ONLY file that talks to node-postgres
// directly to create the connection pool. Every controller imports `pool`
// from here and runs pool.query(...).
//
// Reads its settings from environment variables (see ../../.env.example).
// ---------------------------------------------------------------------------
require('dotenv').config()
const { Pool } = require('pg')

const useConnectionString = !!process.env.DATABASE_URL

const pool = useConnectionString
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    })
  : new Pool({
      host: process.env.PGHOST || 'localhost',
      port: Number(process.env.PGPORT) || 5432,
      database: process.env.PGDATABASE || 'mhc_db',
      user: process.env.PGUSER || 'postgres',
      password: process.env.PGPASSWORD || 'postgres',
      ssl: process.env.PG_SSL === 'true' ? { rejectUnauthorized: false } : false
    })

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL error on idle client', err)
  process.exit(1)
})

// Quick helper so controllers can just do: const { rows } = await query('SELECT ...', [params])
const query = (text, params) => pool.query(text, params)

module.exports = { pool, query }