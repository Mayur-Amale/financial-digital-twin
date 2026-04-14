const { pool } = require("./db");

/**
 * Calculate financial state for a user based on their transactions.
 *
 * @param {number} userId - The user's ID
 * @param {string} startDate - Start of period (YYYY-MM-DD)
 * @param {string} endDate - End of period (YYYY-MM-DD)
 * @returns {object} Calculated financial state
 */
async function calculateFinancialState(userId, startDate, endDate) {
  // Fetch all transactions for the user within the date range
  const [transactions] = await pool.execute(
    `SELECT type, amount
     FROM transactions
     WHERE user_id = ? AND transaction_date BETWEEN ? AND ?`,
    [userId, startDate, endDate]
  );

  // Initialize accumulators
  let totalIncome = 0;
  let totalExpenses = 0;
  let totalInvestments = 0;
  let totalDebt = 0;

  // Aggregate by transaction type
  for (const txn of transactions) {
    const amount = parseFloat(txn.amount);

    switch (txn.type) {
      case "income":
        totalIncome += amount;
        break;
      case "expense":
        totalExpenses += amount;
        break;
      case "investment":
        totalInvestments += amount;
        break;
      case "debt_payment":
        totalDebt += amount;
        break;
    }
  }

  // Net worth = income - expenses - debt (investments are assets, not outflows)
  const netWorth = totalIncome - totalExpenses - totalDebt + totalInvestments;

  // Savings rate = percentage of income saved (after expenses and debt)
  // If no income, savings rate is 0
  const savingsRate =
    totalIncome > 0
      ? parseFloat((((totalIncome - totalExpenses - totalDebt) / totalIncome) * 100).toFixed(2))
      : 0;

  return {
    user_id: userId,
    total_income: totalIncome,
    total_expenses: totalExpenses,
    total_investments: totalInvestments,
    total_debt: totalDebt,
    net_worth: netWorth,
    savings_rate: savingsRate,
    snapshot_date: endDate,
  };
}

/**
 * Calculate and save a financial state snapshot to the database.
 *
 * @param {number} userId
 * @param {string} startDate
 * @param {string} endDate
 * @returns {object} The saved snapshot with its ID
 */
async function saveFinancialSnapshot(userId, startDate, endDate) {
  const state = await calculateFinancialState(userId, startDate, endDate);

  const [result] = await pool.execute(
    `INSERT INTO financial_state
       (user_id, total_income, total_expenses, total_investments, total_debt, net_worth, savings_rate, snapshot_date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      state.user_id,
      state.total_income,
      state.total_expenses,
      state.total_investments,
      state.total_debt,
      state.net_worth,
      state.savings_rate,
      state.snapshot_date,
    ]
  );

  return { id: result.insertId, ...state };
}

module.exports = { calculateFinancialState, saveFinancialSnapshot };
