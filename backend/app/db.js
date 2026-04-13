const mysql = require("mysql2/promise");

// Database connection pool
const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "Mayur@1104",
  database: "financial_twin",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Test the connection
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log("MySQL connected successfully");
    connection.release();
  } catch (error) {
    console.error("MySQL connection failed:", error.message);
    process.exit(1);
  }
}

module.exports = { pool, testConnection };
