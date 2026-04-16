const express = require("express");
const router = express.Router();
const { pool } = require("../app/db");

// ============================================================
// VIEWS — Exposed as GET endpoints
// ============================================================

// GET /api/reports/summary — All users' financial summaries (from view)
router.get("/summary", async (req, res) => {
  try {
    const [rows] = await pool.execute("SELECT * FROM v_user_financial_summary");
    res.json({ summaries: rows });
  } catch (error) {
    console.error("Error fetching summary view:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/reports/spending/:userId — Monthly spending breakdown (from view)
router.get("/spending/:userId", async (req, res) => {
  try {
    const [rows] = await pool.execute(
      "SELECT * FROM v_monthly_spending WHERE user_id = ?",
      [req.params.userId]
    );
    res.json({ spending: rows });
  } catch (error) {
    console.error("Error fetching spending view:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/reports/stats/:userId — Transaction stats by type (from view)
router.get("/stats/:userId", async (req, res) => {
  try {
    const [rows] = await pool.execute(
      "SELECT * FROM v_transaction_stats WHERE user_id = ?",
      [req.params.userId]
    );
    res.json({ stats: rows });
  } catch (error) {
    console.error("Error fetching transaction stats:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ============================================================
// STORED PROCEDURES — Exposed as POST/GET endpoints
// ============================================================

// POST /api/reports/calculate — Run sp_calculate_financial_state
router.post("/calculate", async (req, res) => {
  try {
    const { user_id, start_date, end_date } = req.body;

    if (!user_id || !start_date || !end_date) {
      return res.status(400).json({
        error: "user_id, start_date, and end_date are required",
      });
    }

    const [rows] = await pool.execute(
      "CALL sp_calculate_financial_state(?, ?, ?)",
      [user_id, start_date, end_date]
    );

    // MySQL stored procedure returns result in first element
    const snapshot = rows[0] ? rows[0][0] || rows[0] : null;

    res.status(201).json({
      message: "Financial state calculated via stored procedure",
      financial_state: snapshot,
    });
  } catch (error) {
    console.error("Error calling sp_calculate_financial_state:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/reports/dashboard/:userId — Run sp_get_user_dashboard
router.get("/dashboard/:userId", async (req, res) => {
  try {
    const [results] = await pool.execute(
      "CALL sp_get_user_dashboard(?)",
      [req.params.userId]
    );

    // Stored procedure returns multiple result sets
    res.json({
      user: results[0] ? results[0][0] : null,
      financial_state: results[1] ? results[1][0] : null,
      recent_transactions: results[2] || [],
      transaction_stats: results[3] || [],
    });
  } catch (error) {
    console.error("Error calling sp_get_user_dashboard:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/reports/monthly/:userId/:year/:month — Run sp_monthly_report
router.get("/monthly/:userId/:year/:month", async (req, res) => {
  try {
    const { userId, year, month } = req.params;

    const [results] = await pool.execute(
      "CALL sp_monthly_report(?, ?, ?)",
      [userId, parseInt(year), parseInt(month)]
    );

    res.json({
      summary_by_type: results[0] || [],
      detail_by_category: results[1] || [],
    });
  } catch (error) {
    console.error("Error calling sp_monthly_report:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ============================================================
// AUDIT LOG — View trigger-generated logs
// ============================================================

// GET /api/reports/audit — Get recent audit log entries
router.get("/audit", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const [rows] = await pool.execute(
      "SELECT * FROM audit_log ORDER BY created_at DESC LIMIT ?",
      [limit]
    );
    res.json({ audit_log: rows });
  } catch (error) {
    console.error("Error fetching audit log:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/reports/audit/:userId — Audit log for a specific user
router.get("/audit/:userId", async (req, res) => {
  try {
    const [rows] = await pool.execute(
      "SELECT * FROM audit_log WHERE user_id = ? ORDER BY created_at DESC",
      [req.params.userId]
    );
    res.json({ audit_log: rows });
  } catch (error) {
    console.error("Error fetching user audit log:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
