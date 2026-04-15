const express = require("express");
const router = express.Router();
const { pool } = require("../app/db");
const {
  runNormalSimulation,
  runAntigravitySimulation,
  runComparison,
} = require("../app/simulationEngine");

/**
 * Helper: validate request and build simulation parameters from DB.
 * Returns { user, simParams } or sends an error response.
 */
async function buildSimParams(req, res) {
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

  if (!user_id || !months) {
    res.status(400).json({ error: "user_id and months are required" });
    return null;
  }

  if (months < 1 || months > 360) {
    res.status(400).json({ error: "months must be between 1 and 360" });
    return null;
  }

  const [userRows] = await pool.execute(
    "SELECT id, name, monthly_income FROM users WHERE id = ?",
    [user_id]
  );
  if (userRows.length === 0) {
    res.status(404).json({ error: "User not found" });
    return null;
  }

  const user = userRows[0];

  const [stateRows] = await pool.execute(
    "SELECT * FROM financial_state WHERE user_id = ? ORDER BY snapshot_date DESC LIMIT 1",
    [user_id]
  );
  if (stateRows.length === 0) {
    res.status(400).json({
      error: "No financial state found. Run /api/financial-state/calculate first.",
    });
    return null;
  }

  const latestState = stateRows[0];

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

  return { user, simParams };
}

// POST /api/simulate/normal — Run a normal financial simulation
router.post("/normal", async (req, res) => {
  try {
    const data = await buildSimParams(req, res);
    if (!data) return;

    const { user, simParams } = data;
    const result = runNormalSimulation(simParams);

    res.json({
      message: "Normal simulation completed",
      user: { id: user.id, name: user.name },
      mode: "normal",
      ...result,
    });
  } catch (error) {
    console.error("Error running normal simulation:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/simulate/antigravity — Run an antigravity simulation
router.post("/antigravity", async (req, res) => {
  try {
    const data = await buildSimParams(req, res);
    if (!data) return;

    const { user, simParams } = data;
    const result = runAntigravitySimulation(simParams);

    res.json({
      message: "Antigravity simulation completed",
      user: { id: user.id, name: user.name },
      mode: "antigravity",
      ...result,
    });
  } catch (error) {
    console.error("Error running antigravity simulation:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/simulate/compare — Run both and compare side by side
router.post("/compare", async (req, res) => {
  try {
    const data = await buildSimParams(req, res);
    if (!data) return;

    const { user, simParams } = data;
    const result = runComparison(simParams);

    res.json({
      message: "Comparison simulation completed",
      user: { id: user.id, name: user.name },
      ...result,
    });
  } catch (error) {
    console.error("Error running comparison simulation:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
