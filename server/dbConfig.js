const { Pool } = require('pg');

// Database connection pool
const pool = new Pool({
  user: 'postgres',
  host: '192.168.1.6',
  database: 'php_training',
  schema: 'aman',
  password: 'mawai123',
  port: 5432,
});

module.exports = pool;
