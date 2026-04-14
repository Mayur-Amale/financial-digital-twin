const express = require("express");
const router = express.Router();
const { pool } = require("../app/db");

// POST /api/users — Create a new user
router.post("/", async (req, res) => {
  try {
    const { name, email, monthly_income } = req.body;

    // Validate required fields
    if (!name || !email) {
      return res.status(400).json({ error: "name and email are required" });
    }

    const income = monthly_income || 0;

    const [result] = await pool.execute(
      "INSERT INTO users (name, email, monthly_income) VALUES (?, ?, ?)",
      [name, email, income]
    );

    res.status(201).json({
      message: "User created successfully",
      user: { id: result.insertId, name, email, monthly_income: income },
    });
  } catch (error) {
    // Duplicate email
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "Email already exists" });
    }
    console.error("Error creating user:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/users — Get all users
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.execute("SELECT * FROM users ORDER BY created_at DESC");
    res.json({ users: rows });
  } catch (error) {
    console.error("Error fetching users:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/users/:id — Get a single user by ID
router.get("/:id", async (req, res) => {
  try {
    const [rows] = await pool.execute("SELECT * FROM users WHERE id = ?", [req.params.id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ user: rows[0] });
  } catch (error) {
    console.error("Error fetching user:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
