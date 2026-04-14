const express = require("express");
const router = express.Router();
const { pool } = require("../app/db");

// Valid transaction types
const VALID_TYPES = ["income", "expense", "investment", "debt_payment"];

// POST /api/transactions — Create a new transaction
router.post("/", async (req, res) => {
  try {
    const { user_id, type, category, amount, description, transaction_date } = req.body;

    // Validate required fields
    if (!user_id || !type || !category || !amount || !transaction_date) {
      return res.status(400).json({
        error: "user_id, type, category, amount, and transaction_date are required",
      });
    }

    // Validate type
    if (!VALID_TYPES.includes(type)) {
      return res.status(400).json({
        error: `type must be one of: ${VALID_TYPES.join(", ")}`,
      });
    }

    // Validate amount is positive
    if (amount <= 0) {
      return res.status(400).json({ error: "amount must be greater than 0" });
    }

    // Check if user exists
    const [userRows] = await pool.execute("SELECT id FROM users WHERE id = ?", [user_id]);
    if (userRows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const [result] = await pool.execute(
      `INSERT INTO transactions (user_id, type, category, amount, description, transaction_date)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [user_id, type, category, amount, description || null, transaction_date]
    );

    res.status(201).json({
      message: "Transaction added successfully",
      transaction: {
        id: result.insertId,
        user_id,
        type,
        category,
        amount,
        description: description || null,
        transaction_date,
      },
    });
  } catch (error) {
    console.error("Error creating transaction:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/transactions/:userId — Get all transactions for a user
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    // Check if user exists
    const [userRows] = await pool.execute("SELECT id FROM users WHERE id = ?", [userId]);
    if (userRows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const [rows] = await pool.execute(
      "SELECT * FROM transactions WHERE user_id = ? ORDER BY transaction_date DESC",
      [userId]
    );

    res.json({ transactions: rows });
  } catch (error) {
    console.error("Error fetching transactions:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
