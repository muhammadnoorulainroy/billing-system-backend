const { Pool } = require('pg');

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "billing-system-node",
  password: "postgres",
  port: 5432,
});

module.exports = pool;
