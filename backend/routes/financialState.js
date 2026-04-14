const express = require("express");
const router = express.Router();
const { pool } = require("../app/db");
const { calculateFinancialState, saveFinancialSnapshot } = require("../app/financialCalculator");

// POST /api/financial-state/calculate — Calculate and save a financial snapshot
router.post("/calculate", async (req, res) => {
  try {
    const { user_id, start_date, end_date } = req.body;

    // Validate required fields
    if (!user_id || !start_date || !end_date) {
      return res.status(400).json({
        error: "user_id, start_date, and end_date are required",
      });
    }

    // Check if user exists
    const [userRows] = await pool.execute("SELECT id FROM users WHERE id = ?", [user_id]);
    if (userRows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    // Calculate and save the snapshot
    const snapshot = await saveFinancialSnapshot(user_id, start_date, end_date);

    res.status(201).json({
      message: "Financial state calculated and saved",
      financial_state: snapshot,
    });
  } catch (error) {
    console.error("Error calculating financial state:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/financial-state/:userId — Get all snapshots for a user
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    // Check if user exists
    const [userRows] = await pool.execute("SELECT id FROM users WHERE id = ?", [userId]);
    if (userRows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const [rows] = await pool.execute(
      "SELECT * FROM financial_state WHERE user_id = ? ORDER BY snapshot_date DESC",
      [userId]
    );

    res.json({ financial_states: rows });
  } catch (error) {
    console.error("Error fetching financial state:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/financial-state/:userId/latest — Get the most recent snapshot
router.get("/:userId/latest", async (req, res) => {
  try {
    const { userId } = req.params;

    const [rows] = await pool.execute(
      "SELECT * FROM financial_state WHERE user_id = ? ORDER BY snapshot_date DESC LIMIT 1",
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "No financial state found for this user" });
    }

    res.json({ financial_state: rows[0] });
  } catch (error) {
    console.error("Error fetching latest financial state:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
