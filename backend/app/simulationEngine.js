/**
 * Normal Simulation Engine
 *
 * Projects a user's financial state forward over N months.
 * Applies monthly growth rates to income, expenses, and investments.
 * Tracks debt repayment progress over time.
 */

/**
 * Run a normal (realistic) financial simulation.
 *
 * @param {object} params
 * @param {number} params.monthly_income      - Current monthly income
 * @param {number} params.monthly_expenses    - Current monthly expenses
 * @param {number} params.monthly_investments - Current monthly investment amount
 * @param {number} params.monthly_debt        - Current monthly debt payment
 * @param {number} params.total_debt_balance  - Outstanding debt balance
 * @param {number} params.current_savings     - Current savings balance
 * @param {number} params.months              - Number of months to simulate
 * @param {number} [params.income_growth]     - Monthly income growth rate (default 0.5%)
 * @param {number} [params.expense_inflation] - Monthly expense inflation rate (default 0.3%)
 * @param {number} [params.investment_return] - Monthly investment return rate (default 0.8%)
 * @param {number} [params.debt_interest]     - Monthly debt interest rate (default 1.0%)
 * @returns {object} Simulation results with monthly projections
 */
function runNormalSimulation(params) {
  const {
    monthly_income,
    monthly_expenses,
    monthly_investments,
    monthly_debt,
    total_debt_balance,
    current_savings,
    months,
    income_growth = 0.5,
    expense_inflation = 0.3,
    investment_return = 0.8,
    debt_interest = 1.0,
  } = params;

  // State trackers
  let income = monthly_income;
  let expenses = monthly_expenses;
  let investments = monthly_investments;
  let debtPayment = monthly_debt;
  let debtBalance = total_debt_balance;
  let savings = current_savings;
  let investmentPortfolio = 0;

  // Monthly projections array
  const projections = [];

  for (let month = 1; month <= months; month++) {
    // Apply growth rates
    if (month > 1) {
      income *= 1 + income_growth / 100;
      expenses *= 1 + expense_inflation / 100;
    }

    // Apply debt interest to remaining balance
    if (debtBalance > 0) {
      debtBalance *= 1 + debt_interest / 100;
      debtBalance -= debtPayment;
      if (debtBalance < 0) debtBalance = 0;
    }

    // Monthly surplus (what's left after expenses, investments, and debt)
    const surplus = income - expenses - investments - (debtBalance > 0 ? debtPayment : 0);

    // Add surplus to savings (can be negative = dipping into savings)
    savings += surplus;

    // Grow investment portfolio
    investmentPortfolio += investments;
    investmentPortfolio *= 1 + investment_return / 100;

    // Net worth = savings + investment portfolio - remaining debt
    const netWorth = savings + investmentPortfolio - debtBalance;

    // Savings rate for this month
    const savingsRate = income > 0 ? ((surplus / income) * 100) : 0;

    projections.push({
      month,
      income: round(income),
      expenses: round(expenses),
      investments: round(investments),
      debt_payment: debtBalance > 0 ? round(debtPayment) : 0,
      debt_balance: round(debtBalance),
      savings: round(savings),
      investment_portfolio: round(investmentPortfolio),
      net_worth: round(netWorth),
      savings_rate: round(savingsRate),
    });
  }

  // Summary: compare first and last month
  const first = projections[0];
  const last = projections[projections.length - 1];

  const summary = {
    simulation_months: months,
    starting_net_worth: first.net_worth,
    ending_net_worth: last.net_worth,
    net_worth_change: round(last.net_worth - first.net_worth),
    starting_debt: round(total_debt_balance),
    ending_debt: last.debt_balance,
    debt_cleared: last.debt_balance === 0,
    ending_savings: last.savings,
    ending_investment_portfolio: last.investment_portfolio,
  };

  return { summary, projections };
}

/**
 * Round to 2 decimal places.
 */
function round(value) {
  return Math.round(value * 100) / 100;
}

module.exports = { runNormalSimulation };
