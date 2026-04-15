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
 * Antigravity Simulation Engine
 *
 * Removes traditional financial constraints and inverts pressures:
 *
 * 1. DEBT INVERSION
 *    - Debt balance is flipped into a virtual asset
 *    - Instead of paying interest, debt generates returns
 *    - Debt payments become additional investment contributions
 *
 * 2. CONSTRAINT REMOVAL
 *    - Income grows at 3x the normal rate (accelerated career growth)
 *    - Expenses do NOT inflate (price pressure removed)
 *    - Investment contributions are doubled (no contribution ceiling)
 *
 * 3. ZERO-RISK MODE
 *    - Monthly surplus is never negative (no financial stress months)
 *    - Investment returns are guaranteed (no market downside)
 *    - Savings can never decrease
 */

/**
 * Run an antigravity (constraint-free) financial simulation.
 *
 * @param {object} params - Same params as runNormalSimulation
 * @returns {object} Simulation results with monthly projections
 */
function runAntigravitySimulation(params) {
  const {
    monthly_income,
    monthly_expenses,
    monthly_investments,
    monthly_debt,
    total_debt_balance,
    current_savings,
    months,
    income_growth = 0.5,
    investment_return = 0.8,
  } = params;

  // State trackers
  let income = monthly_income;
  let expenses = monthly_expenses;                 // Frozen — no inflation
  let investments = monthly_investments * 2;       // Constraint removal: doubled contributions
  let savings = current_savings;
  let investmentPortfolio = 0;

  // DEBT INVERSION: debt becomes a virtual asset
  let virtualAsset = total_debt_balance;
  const debtReturnRate = investment_return;         // Earns returns instead of costing interest
  const freedDebtPayment = monthly_debt;            // Freed up cash (no longer paying debt)

  // Accelerated income growth (3x normal)
  const boostMultiplier = 3;
  const boostedGrowth = income_growth * boostMultiplier;

  const projections = [];

  for (let month = 1; month <= months; month++) {
    // CONSTRAINT REMOVAL: accelerated income growth
    if (month > 1) {
      income *= 1 + boostedGrowth / 100;
      // Expenses stay flat — no inflation in antigravity mode
    }

    // DEBT INVERSION: virtual asset grows with returns
    virtualAsset *= 1 + debtReturnRate / 100;

    // Surplus includes freed debt payments (no longer paying debt)
    let surplus = income - expenses - investments + freedDebtPayment;

    // ZERO-RISK: surplus is never negative
    if (surplus < 0) surplus = 0;

    // ZERO-RISK: savings can never decrease
    savings += surplus;

    // Grow investment portfolio (guaranteed positive returns)
    investmentPortfolio += investments;
    investmentPortfolio *= 1 + investment_return / 100;

    // Net worth = savings + portfolio + virtual asset (inverted debt)
    const netWorth = savings + investmentPortfolio + virtualAsset;

    const savingsRate = income > 0 ? ((surplus / income) * 100) : 0;

    projections.push({
      month,
      income: round(income),
      expenses: round(expenses),
      investments: round(investments),
      debt_payment: 0,                               // No debt payments
      debt_balance: 0,                                // Debt eliminated
      virtual_asset: round(virtualAsset),             // Inverted debt
      savings: round(savings),
      investment_portfolio: round(investmentPortfolio),
      net_worth: round(netWorth),
      savings_rate: round(savingsRate),
    });
  }

  const first = projections[0];
  const last = projections[projections.length - 1];

  const summary = {
    simulation_months: months,
    starting_net_worth: first.net_worth,
    ending_net_worth: last.net_worth,
    net_worth_change: round(last.net_worth - first.net_worth),
    starting_debt: 0,
    ending_debt: 0,
    debt_cleared: true,
    virtual_asset_value: last.virtual_asset,
    ending_savings: last.savings,
    ending_investment_portfolio: last.investment_portfolio,
    antigravity_effects: {
      debt_inverted: true,
      original_debt: round(total_debt_balance),
      debt_as_asset: last.virtual_asset,
      constraints_removed: true,
      income_boost_multiplier: boostMultiplier,
      zero_risk_active: true,
    },
  };

  return { summary, projections };
}

/**
 * Run both simulations and produce a comparison.
 *
 * @param {object} params - Simulation parameters
 * @returns {object} Normal results, antigravity results, and delta comparison
 */
function runComparison(params) {
  const normal = runNormalSimulation(params);
  const antigravity = runAntigravitySimulation(params);

  const delta = {
    net_worth_difference: round(
      antigravity.summary.ending_net_worth - normal.summary.ending_net_worth
    ),
    savings_difference: round(
      antigravity.summary.ending_savings - normal.summary.ending_savings
    ),
    portfolio_difference: round(
      antigravity.summary.ending_investment_portfolio -
        normal.summary.ending_investment_portfolio
    ),
    antigravity_advantage_percent: round(
      normal.summary.ending_net_worth !== 0
        ? ((antigravity.summary.ending_net_worth - normal.summary.ending_net_worth) /
            Math.abs(normal.summary.ending_net_worth)) *
            100
        : 100
    ),
  };

  return { normal, antigravity, comparison: delta };
}

/**
 * Round to 2 decimal places.
 */
function round(value) {
  return Math.round(value * 100) / 100;
}

module.exports = { runNormalSimulation, runAntigravitySimulation, runComparison };
