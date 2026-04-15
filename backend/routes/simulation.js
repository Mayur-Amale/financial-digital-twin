const express = require("express");
const router = express.Router();
const { pool } = require("../app/db");
const { runNormalSimulation } = require("../app/simulationEngine");

// POST /api/simulate/normal — Run a normal financial simulation
router.post("/normal", async (req, res) => {
  try {
    const {
      user_id,
      months,
      total_debt_balance,
      current_savings,
      income_growth,
      expense_inflation,
      investment_return,
      debt_interest,
    } = req.body;

    // Validate required fields
    if (!user_id || !months) {
      return res.status(400).json({
        error: "user_id and months are required",
      });
    }

    if (months < 1 || months > 360) {
      return res.status(400).json({
        error: "months must be between 1 and 360",
      });
    }

    // Check if user exists and get their income
    const [userRows] = await pool.execute(
      "SELECT id, name, monthly_income FROM users WHERE id = ?",
      [user_id]
    );
    if (userRows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = userRows[0];

    // Get the user's latest financial state to seed the simulation
    const [stateRows] = await pool.execute(
      "SELECT * FROM financial_state WHERE user_id = ? ORDER BY snapshot_date DESC LIMIT 1",
      [user_id]
    );

    if (stateRows.length === 0) {
      return res.status(400).json({
        error: "No financial state found. Run /api/financial-state/calculate first.",
      });
    }

    const latestState = stateRows[0];

    // Build simulation parameters from the latest financial state
    const simParams = {
      monthly_income: parseFloat(user.monthly_income),
      monthly_expenses: parseFloat(latestState.total_expenses),
      monthly_investments: parseFloat(latestState.total_investments),
      monthly_debt: parseFloat(latestState.total_debt),
      total_debt_balance: total_debt_balance ?? parseFloat(latestState.total_debt) * 12,
      current_savings: current_savings ?? 0,
      months,
      income_growth,
      expense_inflation,
      investment_return,
      debt_interest,
    };

    const result = runNormalSimulation(simParams);

    res.json({
      message: "Normal simulation completed",
      user: { id: user.id, name: user.name },
      mode: "normal",
      parameters: {
        months,
        income_growth: simParams.income_growth ?? 0.5,
        expense_inflation: simParams.expense_inflation ?? 0.3,
        investment_return: simParams.investment_return ?? 0.8,
        debt_interest: simParams.debt_interest ?? 1.0,
      },
      ...result,
    });
  } catch (error) {
    console.error("Error running simulation:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
