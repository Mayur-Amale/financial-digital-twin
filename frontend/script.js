// ================================================
// Financial Digital Twin — Dashboard Logic
// ================================================

const API = "http://localhost:3000/api";

// ---------- State ----------
let currentUserId = null;
let netWorthChart = null;
let breakdownChart = null;

// ---------- DOM Elements ----------
const userSelect = document.getElementById("user-select");
const statusDot = document.getElementById("connection-status");
const txnForm = document.getElementById("txn-form");
const txnList = document.getElementById("txn-list");
const btnRefresh = document.getElementById("btn-refresh-state");
const btnSimNormal = document.getElementById("btn-sim-normal");
const btnSimAntigravity = document.getElementById("btn-sim-antigravity");
const btnSimCompare = document.getElementById("btn-sim-compare");

// ---------- Init ----------
document.addEventListener("DOMContentLoaded", () => {
  checkHealth();
  loadUsers();

  userSelect.addEventListener("change", onUserChange);
  txnForm.addEventListener("submit", onAddTransaction);
  btnRefresh.addEventListener("click", () => refreshFinancialState());
  btnSimNormal.addEventListener("click", () => runSimulation("normal"));
  btnSimAntigravity.addEventListener("click", () => runSimulation("antigravity"));
  btnSimCompare.addEventListener("click", () => runSimulation("compare"));
});

// ---------- API Helpers ----------
async function apiFetch(endpoint, options = {}) {
  try {
    const res = await fetch(`${API}${endpoint}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "API error");
    return data;
  } catch (err) {
    showToast(err.message, "error");
    throw err;
  }
}

async function checkHealth() {
  try {
    await fetch(`${API.replace("/api", "")}/health`);
    statusDot.classList.add("connected");
    statusDot.title = "API Connected";
  } catch {
    statusDot.classList.remove("connected");
    statusDot.title = "API Disconnected";
  }
}

// ---------- Users ----------
async function loadUsers() {
  try {
    const data = await apiFetch("/users");
    userSelect.innerHTML = '<option value="">Select a user...</option>';
    data.users.forEach((u) => {
      const opt = document.createElement("option");
      opt.value = u.id;
      opt.textContent = `${u.name} (₹${formatNum(u.monthly_income)}/mo)`;
      userSelect.appendChild(opt);
    });
  } catch {
    userSelect.innerHTML = '<option value="">Failed to load users</option>';
  }
}

function onUserChange() {
  currentUserId = userSelect.value;
  if (!currentUserId) return;
  loadTransactions();
  loadFinancialState();
}

// ---------- Transactions ----------
async function loadTransactions() {
  try {
    const data = await apiFetch(`/transactions/${currentUserId}`);
    renderTransactions(data.transactions);
  } catch {
    txnList.innerHTML = '<p class="placeholder-text">Failed to load transactions</p>';
  }
}

function renderTransactions(transactions) {
  if (!transactions.length) {
    txnList.innerHTML = '<p class="placeholder-text">No transactions yet</p>';
    return;
  }

  txnList.innerHTML = transactions
    .map((t) => {
      const sign = t.type === "income" ? "+" : "-";
      const dateStr = new Date(t.transaction_date).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
      return `
        <div class="txn-item">
          <div class="txn-info">
            <span class="txn-category">
              ${t.category}
              <span class="txn-type-badge ${t.type}">${t.type.replace("_", " ")}</span>
            </span>
            <span class="txn-meta">${dateStr}${t.description ? " · " + t.description : ""}</span>
          </div>
          <span class="txn-amount ${t.type}">${sign}₹${formatNum(t.amount)}</span>
        </div>`;
    })
    .join("");
}

async function onAddTransaction(e) {
  e.preventDefault();
  if (!currentUserId) {
    showToast("Select a user first", "error");
    return;
  }

  const body = {
    user_id: parseInt(currentUserId),
    type: document.getElementById("txn-type").value,
    category: document.getElementById("txn-category").value,
    amount: parseFloat(document.getElementById("txn-amount").value),
    description: document.getElementById("txn-desc").value || null,
    transaction_date: document.getElementById("txn-date").value,
  };

  try {
    await apiFetch("/transactions", {
      method: "POST",
      body: JSON.stringify(body),
    });
    showToast("Transaction added!", "success");
    txnForm.reset();
    loadTransactions();
  } catch {
    // Error already shown by apiFetch
  }
}

// ---------- Financial State ----------
async function loadFinancialState() {
  try {
    const data = await apiFetch(`/financial-state/${currentUserId}/latest`);
    renderFinancialState(data.financial_state);
  } catch {
    clearFinancialState();
  }
}

async function refreshFinancialState() {
  if (!currentUserId) {
    showToast("Select a user first", "error");
    return;
  }

  // Use current month range
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];

  try {
    showToast("Calculating financial state...", "info");
    await apiFetch("/financial-state/calculate", {
      method: "POST",
      body: JSON.stringify({
        user_id: parseInt(currentUserId),
        start_date: start,
        end_date: end,
      }),
    });
    await loadFinancialState();
    showToast("Financial state updated!", "success");
  } catch {
    // Error shown by apiFetch
  }
}

function renderFinancialState(state) {
  document.getElementById("val-income").textContent = `₹${formatNum(state.total_income)}`;
  document.getElementById("val-expenses").textContent = `₹${formatNum(state.total_expenses)}`;
  document.getElementById("val-investments").textContent = `₹${formatNum(state.total_investments)}`;
  document.getElementById("val-debt").textContent = `₹${formatNum(state.total_debt)}`;
  document.getElementById("val-networth").textContent = `₹${formatNum(state.net_worth)}`;
  document.getElementById("val-savings-rate").textContent = `${state.savings_rate}%`;
}

function clearFinancialState() {
  ["val-income", "val-expenses", "val-investments", "val-debt", "val-networth", "val-savings-rate"]
    .forEach((id) => (document.getElementById(id).textContent = "—"));
}

// ---------- Simulation ----------
async function runSimulation(mode) {
  if (!currentUserId) {
    showToast("Select a user first", "error");
    return;
  }

  const months = parseInt(document.getElementById("sim-months").value) || 12;
  const currentSavings = parseFloat(document.getElementById("sim-savings").value) || 0;
  const debtBalance = parseFloat(document.getElementById("sim-debt-balance").value) || 0;

  const body = {
    user_id: parseInt(currentUserId),
    months,
    current_savings: currentSavings,
    total_debt_balance: debtBalance,
  };

  try {
    showToast(`Running ${mode} simulation...`, "info");
    const data = await apiFetch(`/simulate/${mode}`, {
      method: "POST",
      body: JSON.stringify(body),
    });

    if (mode === "compare") {
      renderComparisonChart(data);
      renderComparisonSummary(data.comparison);
    } else {
      renderSingleChart(data, mode);
      hideComparison();
    }

    showToast(`${capitalize(mode)} simulation complete!`, "success");
  } catch {
    // Error shown by apiFetch
  }
}

// ---------- Charts ----------
function renderSingleChart(data, mode) {
  const labels = data.projections.map((p) => `M${p.month}`);
  const color = mode === "antigravity" ? "#a78bfa" : "#60a5fa";
  const colorBg = mode === "antigravity" ? "rgba(167,139,250,0.1)" : "rgba(96,165,250,0.1)";

  // Net Worth Chart
  destroyChart("networth");
  netWorthChart = new Chart(document.getElementById("chart-networth"), {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: `Net Worth (${capitalize(mode)})`,
          data: data.projections.map((p) => p.net_worth),
          borderColor: color,
          backgroundColor: colorBg,
          fill: true,
          tension: 0.4,
          pointRadius: 2,
          pointHoverRadius: 5,
        },
      ],
    },
    options: chartOptions("Net Worth Over Time (₹)"),
  });

  // Breakdown Chart
  destroyChart("breakdown");
  breakdownChart = new Chart(document.getElementById("chart-breakdown"), {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Savings",
          data: data.projections.map((p) => p.savings),
          backgroundColor: "rgba(52,211,153,0.6)",
          borderRadius: 4,
        },
        {
          label: "Portfolio",
          data: data.projections.map((p) => p.investment_portfolio),
          backgroundColor: "rgba(6,182,212,0.6)",
          borderRadius: 4,
        },
        {
          label: "Debt",
          data: data.projections.map((p) => p.debt_balance),
          backgroundColor: "rgba(248,113,113,0.6)",
          borderRadius: 4,
        },
      ],
    },
    options: chartOptions("Savings · Portfolio · Debt (₹)"),
  });
}

function renderComparisonChart(data) {
  const labels = data.normal.projections.map((p) => `M${p.month}`);

  // Net Worth Comparison
  destroyChart("networth");
  netWorthChart = new Chart(document.getElementById("chart-networth"), {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Normal",
          data: data.normal.projections.map((p) => p.net_worth),
          borderColor: "#60a5fa",
          backgroundColor: "rgba(96,165,250,0.08)",
          fill: true,
          tension: 0.4,
          pointRadius: 2,
        },
        {
          label: "Antigravity",
          data: data.antigravity.projections.map((p) => p.net_worth),
          borderColor: "#a78bfa",
          backgroundColor: "rgba(167,139,250,0.08)",
          fill: true,
          tension: 0.4,
          pointRadius: 2,
        },
      ],
    },
    options: chartOptions("Net Worth Comparison (₹)"),
  });

  // Savings Comparison
  destroyChart("breakdown");
  breakdownChart = new Chart(document.getElementById("chart-breakdown"), {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Normal Savings",
          data: data.normal.projections.map((p) => p.savings),
          borderColor: "#34d399",
          borderDash: [5, 5],
          tension: 0.4,
          pointRadius: 1,
        },
        {
          label: "Antigravity Savings",
          data: data.antigravity.projections.map((p) => p.savings),
          borderColor: "#f472b6",
          tension: 0.4,
          pointRadius: 1,
        },
        {
          label: "Normal Portfolio",
          data: data.normal.projections.map((p) => p.investment_portfolio),
          borderColor: "#06b6d4",
          borderDash: [5, 5],
          tension: 0.4,
          pointRadius: 1,
        },
        {
          label: "Antigravity Portfolio",
          data: data.antigravity.projections.map((p) => p.investment_portfolio),
          borderColor: "#fbbf24",
          tension: 0.4,
          pointRadius: 1,
        },
      ],
    },
    options: chartOptions("Savings & Portfolio Comparison (₹)"),
  });
}

function renderComparisonSummary(comparison) {
  document.getElementById("cmp-networth").textContent = `₹${formatNum(comparison.net_worth_difference)}`;
  document.getElementById("cmp-savings").textContent = `₹${formatNum(comparison.savings_difference)}`;
  document.getElementById("cmp-portfolio").textContent = `₹${formatNum(comparison.portfolio_difference)}`;
  document.getElementById("cmp-advantage").textContent = `${comparison.antigravity_advantage_percent}%`;
  document.getElementById("comparison-summary").style.display = "block";
}

function hideComparison() {
  document.getElementById("comparison-summary").style.display = "none";
}

function chartOptions(title) {
  return {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        labels: {
          color: "#94a3b8",
          font: { family: "'Inter', sans-serif", size: 11 },
          usePointStyle: true,
          pointStyle: "circle",
        },
      },
      title: {
        display: true,
        text: title,
        color: "#f1f5f9",
        font: { family: "'Inter', sans-serif", size: 13, weight: 600 },
        padding: { bottom: 12 },
      },
      tooltip: {
        backgroundColor: "rgba(15, 23, 42, 0.9)",
        titleFont: { family: "'Inter', sans-serif" },
        bodyFont: { family: "'Inter', sans-serif" },
        borderColor: "rgba(148,163,184,0.2)",
        borderWidth: 1,
        callbacks: {
          label: (ctx) => `${ctx.dataset.label}: ₹${formatNum(ctx.parsed.y)}`,
        },
      },
    },
    scales: {
      x: {
        ticks: { color: "#64748b", font: { size: 10 } },
        grid: { color: "rgba(148,163,184,0.06)" },
      },
      y: {
        ticks: {
          color: "#64748b",
          font: { size: 10 },
          callback: (v) => `₹${v >= 1000 ? (v / 1000).toFixed(0) + "K" : v}`,
        },
        grid: { color: "rgba(148,163,184,0.06)" },
      },
    },
    interaction: {
      intersect: false,
      mode: "index",
    },
  };
}

function destroyChart(type) {
  if (type === "networth" && netWorthChart) {
    netWorthChart.destroy();
    netWorthChart = null;
  }
  if (type === "breakdown" && breakdownChart) {
    breakdownChart.destroy();
    breakdownChart = null;
  }
}

// ---------- Utilities ----------
function formatNum(num) {
  return parseFloat(num).toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function showToast(message, type = "info") {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.className = `toast ${type} show`;
  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}
