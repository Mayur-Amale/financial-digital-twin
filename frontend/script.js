// ================================================
// Financial Digital Twin — Dashboard Logic
// Investment Instruments · SIP Calculator · Charts
// ================================================

const API = window.location.hostname === "localhost"
  ? "http://localhost:3000/api"
  : `${window.location.origin}/api`;

// ---------- Investment Instruments ----------
const INSTRUMENTS = [
  {
    id: "nifty50",
    name: "Nifty 50 Index Fund",
    icon: "📊",
    annualReturn: 12,
    risk: "moderate",
    riskLabel: "Moderate",
    color: "#3b82f6",
    description: "Tracks top 50 Indian companies",
  },
  {
    id: "mutual_equity",
    name: "Mutual Fund (Equity)",
    icon: "🚀",
    annualReturn: 14,
    risk: "high",
    riskLabel: "High",
    color: "#8b5cf6",
    description: "Actively managed equity funds",
  },
  {
    id: "mutual_debt",
    name: "Mutual Fund (Debt)",
    icon: "🛡️",
    annualReturn: 7,
    risk: "low",
    riskLabel: "Low",
    color: "#14b8a6",
    description: "Stable debt-oriented funds",
  },
  {
    id: "fd",
    name: "Fixed Deposit",
    icon: "🏦",
    annualReturn: 7.5,
    risk: "very-low",
    riskLabel: "Very Low",
    color: "#f97316",
    description: "Guaranteed bank returns",
  },
  {
    id: "ppf",
    name: "PPF",
    icon: "🏛️",
    annualReturn: 7.1,
    risk: "very-low",
    riskLabel: "Very Low",
    color: "#10b981",
    description: "Public Provident Fund — tax-free",
  },
  {
    id: "gold",
    name: "Gold",
    icon: "🥇",
    annualReturn: 10,
    risk: "moderate",
    riskLabel: "Moderate",
    color: "#f59e0b",
    description: "Sovereign gold bonds / ETFs",
  },
  {
    id: "crypto",
    name: "Cryptocurrency",
    icon: "₿",
    annualReturn: 25,
    risk: "very-high",
    riskLabel: "Very High",
    color: "#ec4899",
    description: "Bitcoin, Ethereum & altcoins",
  },
  {
    id: "savings_account",
    name: "Savings Account",
    icon: "💳",
    annualReturn: 4,
    risk: "very-low",
    riskLabel: "Very Low",
    color: "#6366f1",
    description: "Regular bank savings interest",
  },
];

// ---------- State ----------
let currentUserId = null;
let netWorthChart = null;
let breakdownChart = null;
let dashTrendChart = null;
let dashDonutChart = null;
let investGrowthChart = null;
let investDonutChart = null;
let investBarChart = null;
let selectedInstruments = new Set();
let currentPage = "dashboard";

// ---------- DOM Elements ----------
const userSelect = document.getElementById("user-select");
const statusDot = document.getElementById("connection-status");
const txnForm = document.getElementById("txn-form");
const txnList = document.getElementById("txn-list");
const btnRefresh = document.getElementById("btn-refresh-state");
const btnSimNormal = document.getElementById("btn-sim-normal");
const btnSimAntigravity = document.getElementById("btn-sim-antigravity");
const btnSimCompare = document.getElementById("btn-sim-compare");
const btnCalculateReturns = document.getElementById("btn-calculate-returns");

// ---------- Init ----------
document.addEventListener("DOMContentLoaded", () => {
  checkHealth();
  loadUsers();
  renderInstrumentCards();
  setupNavigation();
  setupMobileMenu();

  userSelect.addEventListener("change", onUserChange);
  txnForm.addEventListener("submit", onAddTransaction);
  btnRefresh.addEventListener("click", () => refreshFinancialState());
  btnSimNormal.addEventListener("click", () => runSimulation("normal"));
  btnSimAntigravity.addEventListener("click", () => runSimulation("antigravity"));
  btnSimCompare.addEventListener("click", () => runSimulation("compare"));
  btnCalculateReturns.addEventListener("click", calculateInvestmentReturns);

  // Set default date to today for transaction form
  const today = new Date().toISOString().split("T")[0];
  document.getElementById("txn-date").value = today;
});

// ---------- Navigation ----------
function setupNavigation() {
  const navItems = document.querySelectorAll(".nav-item[data-page]");
  const pageTitles = {
    dashboard: { icon: "📊", text: "Dashboard" },
    investments: { icon: "📈", text: "Investments" },
    transactions: { icon: "💸", text: "Transactions" },
    simulate: { icon: "⚡", text: "Simulate" },
  };

  navItems.forEach((item) => {
    item.addEventListener("click", () => {
      const page = item.dataset.page;
      if (page === currentPage) return;

      // Update nav active state
      navItems.forEach((n) => n.classList.remove("active"));
      item.classList.add("active");

      // Switch page
      document.querySelectorAll(".content-page").forEach((p) => p.classList.remove("active"));
      const pageEl = document.getElementById(`page-${page}`);
      if (pageEl) {
        pageEl.classList.add("active");
        // Re-trigger animation
        pageEl.style.animation = "none";
        pageEl.offsetHeight; // reflow
        pageEl.style.animation = "";
      }

      // Update header
      const info = pageTitles[page] || { icon: "📊", text: "Dashboard" };
      document.getElementById("page-icon").textContent = info.icon;
      document.getElementById("page-title-text").textContent = info.text;

      currentPage = page;

      // Close mobile sidebar
      closeMobileSidebar();
    });
  });
}

function setupMobileMenu() {
  const btn = document.getElementById("mobile-menu-btn");
  const overlay = document.getElementById("sidebar-overlay");
  const sidebar = document.getElementById("sidebar");

  btn.addEventListener("click", () => {
    sidebar.classList.toggle("open");
    overlay.classList.toggle("show");
  });

  overlay.addEventListener("click", closeMobileSidebar);
}

function closeMobileSidebar() {
  document.getElementById("sidebar").classList.remove("open");
  document.getElementById("sidebar-overlay").classList.remove("show");
}

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
    userSelect.innerHTML = '<option value="">Select user…</option>';
    data.users.forEach((u) => {
      const opt = document.createElement("option");
      opt.value = u.id;
      opt.textContent = `${u.name} (₹${formatNum(u.monthly_income)}/mo)`;
      userSelect.appendChild(opt);
    });
  } catch {
    userSelect.innerHTML = '<option value="">Failed to load</option>';
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

const TXN_ICONS = {
  income: "💰",
  expense: "🛒",
  investment: "📈",
  debt_payment: "🏦",
};

function renderTransactions(transactions) {
  if (!transactions.length) {
    txnList.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📭</div>
        <div class="empty-state-text">No transactions yet. Add your first transaction to get started.</div>
      </div>`;
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
      const icon = TXN_ICONS[t.type] || "💸";
      return `
        <div class="txn-item">
          <div class="txn-left">
            <div class="txn-icon-wrapper ${t.type}">${icon}</div>
            <div class="txn-info">
              <span class="txn-category">
                ${t.category}
                <span class="txn-type-badge ${t.type}">${t.type.replace("_", " ")}</span>
              </span>
              <span class="txn-meta">${dateStr}${t.description ? " · " + t.description : ""}</span>
            </div>
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
    document.getElementById("txn-date").value = new Date().toISOString().split("T")[0];
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

  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];

  try {
    showToast("Calculating financial state…", "info");
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
  animateValue("val-income", `₹${formatNum(state.total_income)}`);
  animateValue("val-expenses", `₹${formatNum(state.total_expenses)}`);
  animateValue("val-investments", `₹${formatNum(state.total_investments)}`);
  animateValue("val-debt", `₹${formatNum(state.total_debt)}`);
  animateValue("val-networth", `₹${formatNum(state.net_worth)}`);
  animateValue("val-savings-rate", `${state.savings_rate}%`);

  // Update trend badges
  document.getElementById("trend-income").textContent = state.total_income > 0 ? "↑ Active" : "—";
  document.getElementById("trend-expenses").textContent = state.total_expenses > 0 ? "↓ Tracked" : "—";
  document.getElementById("trend-investments").textContent = state.total_investments > 0 ? "↑ Growing" : "—";
  document.getElementById("trend-debt").textContent = state.total_debt > 0 ? "↓ Paying" : "✓ Clear";
  document.getElementById("trend-networth").textContent = state.net_worth > 0 ? "↑ Positive" : "↓ Negative";
  document.getElementById("trend-savings").textContent = state.savings_rate > 20 ? "↑ Good" : state.savings_rate > 0 ? "→ Fair" : "—";

  // Set correct classes for trends
  document.getElementById("trend-debt").className = `metric-trend ${state.total_debt > 0 ? "down" : "up"}`;
  document.getElementById("trend-networth").className = `metric-trend ${state.net_worth >= 0 ? "up" : "down"}`;
  document.getElementById("trend-savings").className = `metric-trend ${state.savings_rate > 20 ? "up" : "down"}`;

  // Render dashboard donut
  renderDashboardDonut(state);
}

function clearFinancialState() {
  ["val-income", "val-expenses", "val-investments", "val-debt", "val-networth", "val-savings-rate"]
    .forEach((id) => (document.getElementById(id).textContent = "—"));
}

function animateValue(elementId, finalText) {
  const el = document.getElementById(elementId);
  el.style.opacity = "0";
  el.style.transform = "translateY(4px)";
  setTimeout(() => {
    el.textContent = finalText;
    el.style.transition = "all 0.35s ease-out";
    el.style.opacity = "1";
    el.style.transform = "translateY(0)";
  }, 80);
}

// ---------- Dashboard Donut ----------
function renderDashboardDonut(state) {
  const labels = ["Income", "Expenses", "Investments", "Debt Payments"];
  const values = [
    parseFloat(state.total_income) || 0,
    parseFloat(state.total_expenses) || 0,
    parseFloat(state.total_investments) || 0,
    parseFloat(state.total_debt) || 0,
  ];
  const colors = ["#10b981", "#ef4444", "#3b82f6", "#f97316"];

  if (dashDonutChart) dashDonutChart.destroy();
  dashDonutChart = new Chart(document.getElementById("chart-dashboard-donut"), {
    type: "doughnut",
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: colors.map((c) => c + "cc"),
        borderColor: colors,
        borderWidth: 2,
        hoverOffset: 6,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      cutout: "68%",
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "rgba(10, 17, 32, 0.95)",
          titleFont: { family: "'Inter', sans-serif" },
          bodyFont: { family: "'Inter', sans-serif" },
          callbacks: {
            label: (ctx) => `${ctx.label}: ₹${formatNum(ctx.parsed)}`,
          },
        },
      },
    },
  });

  // Legend
  const legendEl = document.getElementById("dashboard-donut-legend");
  legendEl.innerHTML = labels
    .map((label, i) => `
      <div class="legend-item">
        <div class="legend-dot" style="background:${colors[i]}"></div>
        <span class="legend-label">${label}</span>
        <span class="legend-value">₹${formatNum(values[i])}</span>
      </div>
    `)
    .join("");
}

// ---------- Investment Instruments ----------
function renderInstrumentCards() {
  const grid = document.getElementById("instruments-grid");
  grid.innerHTML = INSTRUMENTS.map((inst) => `
    <div class="instrument-card" data-instrument="${inst.id}" id="inst-card-${inst.id}">
      <div class="instrument-check"></div>
      <div class="instrument-top">
        <div class="instrument-icon ${inst.id}">${inst.icon}</div>
        <div class="instrument-info">
          <h3>${inst.name}</h3>
          <div class="instrument-meta">
            <span class="instrument-return">${inst.annualReturn}% p.a.</span>
            <span class="risk-badge ${inst.risk}">${inst.riskLabel}</span>
          </div>
        </div>
      </div>
      <p style="font-size:0.72rem;color:var(--text-muted);margin-bottom:0.6rem;">${inst.description}</p>
      <div class="instrument-sip">
        <label>Monthly SIP ₹</label>
        <input type="number" id="sip-${inst.id}" placeholder="e.g. 5000" min="0" step="500" value="0">
      </div>
    </div>
  `).join("");

  // Toggle selection on card click
  document.querySelectorAll(".instrument-card").forEach((card) => {
    card.addEventListener("click", (e) => {
      // Don't toggle if clicking the input
      if (e.target.tagName === "INPUT") return;

      const instId = card.dataset.instrument;
      card.classList.toggle("selected");
      if (selectedInstruments.has(instId)) {
        selectedInstruments.delete(instId);
        document.getElementById(`sip-${instId}`).value = "0";
      } else {
        selectedInstruments.add(instId);
        const sipInput = document.getElementById(`sip-${instId}`);
        if (sipInput.value === "0") sipInput.value = "5000";
        sipInput.focus();
      }
    });

    // Auto-select on SIP input
    const instId = card.dataset.instrument;
    const sipInput = document.getElementById(`sip-${instId}`);
    sipInput.addEventListener("input", () => {
      const val = parseFloat(sipInput.value) || 0;
      if (val > 0 && !selectedInstruments.has(instId)) {
        selectedInstruments.add(instId);
        card.classList.add("selected");
      } else if (val <= 0 && selectedInstruments.has(instId)) {
        selectedInstruments.delete(instId);
        card.classList.remove("selected");
      }
    });

    // Stop click propagation on input
    sipInput.addEventListener("click", (e) => e.stopPropagation());
  });
}

// ---------- SIP Return Calculator ----------
function calculateSIPFutureValue(monthlySIP, annualReturnPercent, years) {
  const monthlyRate = annualReturnPercent / 100 / 12;
  const months = years * 12;
  if (monthlyRate === 0) return monthlySIP * months;
  // FV = SIP × [((1 + r)^n - 1) / r] × (1 + r)
  const fv = monthlySIP * (((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate));
  return fv;
}

function calculateLumpsumFutureValue(principal, annualReturnPercent, years) {
  return principal * Math.pow(1 + annualReturnPercent / 100, years);
}

function calculateInvestmentReturns() {
  const years = parseInt(document.getElementById("invest-years").value) || 5;
  const lumpsum = parseFloat(document.getElementById("invest-lumpsum").value) || 0;

  // Gather selected instruments with SIP > 0
  const investments = [];
  INSTRUMENTS.forEach((inst) => {
    const sip = parseFloat(document.getElementById(`sip-${inst.id}`).value) || 0;
    if (sip > 0) {
      const totalInvested = sip * years * 12 + (lumpsum > 0 ? lumpsum / selectedInstruments.size : 0);
      const lumpsumShare = lumpsum > 0 ? lumpsum / Math.max(selectedInstruments.size, 1) : 0;
      const sipFV = calculateSIPFutureValue(sip, inst.annualReturn, years);
      const lumpsumFV = lumpsumShare > 0 ? calculateLumpsumFutureValue(lumpsumShare, inst.annualReturn, years) : 0;
      const futureValue = sipFV + lumpsumFV;
      const totalInvestedActual = sip * years * 12 + lumpsumShare;

      investments.push({
        ...inst,
        sip,
        lumpsumShare,
        totalInvested: totalInvestedActual,
        futureValue,
        gain: futureValue - totalInvestedActual,
      });
    }
  });

  if (investments.length === 0) {
    showToast("Select at least one instrument and enter a SIP amount", "error");
    return;
  }

  // Render returns table
  renderReturnsTable(investments, years);
  // Render portfolio summary
  renderPortfolioSummary(investments);
  // Render charts
  renderInvestmentCharts(investments, years);

  // Show hidden sections
  document.getElementById("portfolio-summary").style.display = "grid";
  document.getElementById("returns-card").style.display = "block";
  document.getElementById("invest-charts").style.display = "grid";

  showToast(`Projected returns calculated for ${years} years!`, "success");
}

function renderReturnsTable(investments, years) {
  const tbody = document.getElementById("returns-tbody");

  let totalInvested = 0;
  let totalFV = 0;
  let totalGain = 0;

  const rows = investments.map((inv) => {
    totalInvested += inv.totalInvested;
    totalFV += inv.futureValue;
    totalGain += inv.gain;

    return `
      <tr>
        <td>
          <div class="instrument-name-cell">
            <div class="mini-dot" style="background:${inv.color}"></div>
            <span>${inv.icon} ${inv.name}</span>
          </div>
        </td>
        <td>₹${formatNum(inv.sip)}</td>
        <td>${inv.annualReturn}%</td>
        <td><span class="risk-badge ${inv.risk}">${inv.riskLabel}</span></td>
        <td>₹${formatNum(inv.totalInvested)}</td>
        <td>₹${formatNum(inv.futureValue)}</td>
        <td class="returns-positive">+₹${formatNum(inv.gain)}</td>
      </tr>
    `;
  });

  // Total row
  rows.push(`
    <tr class="total-row">
      <td><strong>Total Portfolio</strong></td>
      <td>₹${formatNum(investments.reduce((s, i) => s + i.sip, 0))}</td>
      <td>—</td>
      <td>—</td>
      <td><strong>₹${formatNum(totalInvested)}</strong></td>
      <td><strong>₹${formatNum(totalFV)}</strong></td>
      <td class="returns-positive"><strong>+₹${formatNum(totalGain)}</strong></td>
    </tr>
  `);

  tbody.innerHTML = rows.join("");
}

function renderPortfolioSummary(investments) {
  const totalInvested = investments.reduce((s, i) => s + i.totalInvested, 0);
  const totalFV = investments.reduce((s, i) => s + i.futureValue, 0);
  const totalGain = totalFV - totalInvested;

  document.getElementById("ps-invested").textContent = `₹${formatNum(totalInvested)}`;
  document.getElementById("ps-returns").textContent = `+₹${formatNum(totalGain)}`;
  document.getElementById("ps-total").textContent = `₹${formatNum(totalFV)}`;
}

// ---------- Investment Charts ----------
function renderInvestmentCharts(investments, years) {
  renderInvestGrowthChart(investments, years);
  renderInvestDonutChart(investments);
  renderInvestBarChart(investments);
}

function renderInvestGrowthChart(investments, years) {
  const months = years * 12;
  const labels = [];
  for (let y = 0; y <= years; y++) {
    labels.push(y === 0 ? "Start" : `Year ${y}`);
  }

  const datasets = investments.map((inv) => {
    const dataPoints = [];
    for (let y = 0; y <= years; y++) {
      if (y === 0) {
        dataPoints.push(inv.lumpsumShare || 0);
      } else {
        const sipFV = calculateSIPFutureValue(inv.sip, inv.annualReturn, y);
        const lumpsumFV = inv.lumpsumShare > 0
          ? calculateLumpsumFutureValue(inv.lumpsumShare, inv.annualReturn, y)
          : 0;
        dataPoints.push(Math.round(sipFV + lumpsumFV));
      }
    }
    return {
      label: inv.name,
      data: dataPoints,
      borderColor: inv.color,
      backgroundColor: inv.color + "18",
      fill: true,
      tension: 0.4,
      pointRadius: 3,
      pointHoverRadius: 6,
      pointBackgroundColor: inv.color,
      borderWidth: 2,
    };
  });

  if (investGrowthChart) investGrowthChart.destroy();
  investGrowthChart = new Chart(document.getElementById("chart-invest-growth"), {
    type: "line",
    data: { labels, datasets },
    options: chartOptions("Investment Growth Over Time"),
  });
}

function renderInvestDonutChart(investments) {
  const labels = investments.map((i) => i.name);
  const values = investments.map((i) => i.futureValue);
  const colors = investments.map((i) => i.color);

  if (investDonutChart) investDonutChart.destroy();
  investDonutChart = new Chart(document.getElementById("chart-invest-donut"), {
    type: "doughnut",
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: colors.map((c) => c + "cc"),
        borderColor: colors,
        borderWidth: 2,
        hoverOffset: 8,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      cutout: "65%",
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "rgba(10, 17, 32, 0.95)",
          callbacks: {
            label: (ctx) => {
              const pct = ((ctx.parsed / values.reduce((a, b) => a + b, 0)) * 100).toFixed(1);
              return `${ctx.label}: ₹${formatNum(ctx.parsed)} (${pct}%)`;
            },
          },
        },
      },
    },
  });

  // Legend
  const total = values.reduce((a, b) => a + b, 0);
  document.getElementById("invest-donut-legend").innerHTML = investments
    .map((inv, i) => {
      const pct = total > 0 ? ((inv.futureValue / total) * 100).toFixed(1) : 0;
      return `
        <div class="legend-item">
          <div class="legend-dot" style="background:${inv.color}"></div>
          <span class="legend-label">${inv.name}</span>
          <span class="legend-value">${pct}%</span>
        </div>`;
    })
    .join("");
}

function renderInvestBarChart(investments) {
  if (investBarChart) investBarChart.destroy();
  investBarChart = new Chart(document.getElementById("chart-invest-bar"), {
    type: "bar",
    data: {
      labels: investments.map((i) => i.name.length > 16 ? i.name.slice(0, 16) + "…" : i.name),
      datasets: [
        {
          label: "Invested",
          data: investments.map((i) => i.totalInvested),
          backgroundColor: "rgba(100, 120, 160, 0.25)",
          borderColor: "rgba(100, 120, 160, 0.4)",
          borderWidth: 1,
          borderRadius: 4,
        },
        {
          label: "Returns",
          data: investments.map((i) => i.gain),
          backgroundColor: investments.map((i) => i.color + "55"),
          borderColor: investments.map((i) => i.color),
          borderWidth: 1,
          borderRadius: 4,
        },
      ],
    },
    options: {
      ...chartOptions("Invested vs Returns"),
      scales: {
        ...chartOptions("").scales,
        x: {
          ...chartOptions("").scales.x,
          ticks: { color: "#5a6880", font: { size: 9 }, maxRotation: 45 },
        },
      },
    },
  });
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
    showToast(`Running ${mode} simulation…`, "info");
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

// ---------- Simulation Charts ----------
function renderSingleChart(data, mode) {
  const labels = data.projections.map((p) => `M${p.month}`);
  const color = mode === "antigravity" ? "#8b5cf6" : "#3b82f6";
  const colorBg = mode === "antigravity" ? "rgba(139,92,246,0.1)" : "rgba(59,130,246,0.1)";

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
          borderWidth: 2,
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
          backgroundColor: "rgba(16,185,129,0.5)",
          borderRadius: 4,
        },
        {
          label: "Portfolio",
          data: data.projections.map((p) => p.investment_portfolio),
          backgroundColor: "rgba(59,130,246,0.5)",
          borderRadius: 4,
        },
        {
          label: "Debt",
          data: data.projections.map((p) => p.debt_balance),
          backgroundColor: "rgba(239,68,68,0.5)",
          borderRadius: 4,
        },
      ],
    },
    options: chartOptions("Savings · Portfolio · Debt (₹)"),
  });

  // Also update dashboard trend chart
  renderDashboardTrend(data.projections);
}

function renderComparisonChart(data) {
  const labels = data.normal.projections.map((p) => `M${p.month}`);

  destroyChart("networth");
  netWorthChart = new Chart(document.getElementById("chart-networth"), {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Normal",
          data: data.normal.projections.map((p) => p.net_worth),
          borderColor: "#3b82f6",
          backgroundColor: "rgba(59,130,246,0.06)",
          fill: true,
          tension: 0.4,
          pointRadius: 2,
          borderWidth: 2,
        },
        {
          label: "Antigravity",
          data: data.antigravity.projections.map((p) => p.net_worth),
          borderColor: "#8b5cf6",
          backgroundColor: "rgba(139,92,246,0.06)",
          fill: true,
          tension: 0.4,
          pointRadius: 2,
          borderWidth: 2,
        },
      ],
    },
    options: chartOptions("Net Worth Comparison (₹)"),
  });

  destroyChart("breakdown");
  breakdownChart = new Chart(document.getElementById("chart-breakdown"), {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Normal Savings",
          data: data.normal.projections.map((p) => p.savings),
          borderColor: "#10b981",
          borderDash: [5, 5],
          tension: 0.4,
          pointRadius: 1,
          borderWidth: 2,
        },
        {
          label: "Antigravity Savings",
          data: data.antigravity.projections.map((p) => p.savings),
          borderColor: "#ec4899",
          tension: 0.4,
          pointRadius: 1,
          borderWidth: 2,
        },
        {
          label: "Normal Portfolio",
          data: data.normal.projections.map((p) => p.investment_portfolio),
          borderColor: "#06b6d4",
          borderDash: [5, 5],
          tension: 0.4,
          pointRadius: 1,
          borderWidth: 2,
        },
        {
          label: "Antigravity Portfolio",
          data: data.antigravity.projections.map((p) => p.investment_portfolio),
          borderColor: "#f59e0b",
          tension: 0.4,
          pointRadius: 1,
          borderWidth: 2,
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

// Dashboard trend mini-chart
function renderDashboardTrend(projections) {
  if (!projections || projections.length === 0) return;

  const labels = projections.map((p) => `M${p.month}`);

  if (dashTrendChart) dashTrendChart.destroy();
  dashTrendChart = new Chart(document.getElementById("chart-dashboard-trend"), {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "Net Worth",
        data: projections.map((p) => p.net_worth),
        borderColor: "#3b82f6",
        backgroundColor: "rgba(59, 130, 246, 0.08)",
        fill: true,
        tension: 0.4,
        pointRadius: 1,
        pointHoverRadius: 4,
        borderWidth: 2,
      }],
    },
    options: chartOptions("Net Worth Projection"),
  });
}

// ---------- Chart Shared Options ----------
function chartOptions(title) {
  return {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        labels: {
          color: "#8b98b0",
          font: { family: "'Inter', sans-serif", size: 11 },
          usePointStyle: true,
          pointStyle: "circle",
          padding: 16,
        },
      },
      title: {
        display: !!title,
        text: title,
        color: "#e8ecf4",
        font: { family: "'Inter', sans-serif", size: 13, weight: 600 },
        padding: { bottom: 16 },
      },
      tooltip: {
        backgroundColor: "rgba(10, 17, 32, 0.95)",
        titleFont: { family: "'Inter', sans-serif", size: 12 },
        bodyFont: { family: "'Inter', sans-serif", size: 11 },
        borderColor: "rgba(100,120,160,0.2)",
        borderWidth: 1,
        padding: 10,
        cornerRadius: 8,
        callbacks: {
          label: (ctx) => `${ctx.dataset.label}: ₹${formatNum(ctx.parsed.y)}`,
        },
      },
    },
    scales: {
      x: {
        ticks: { color: "#5a6880", font: { size: 10 } },
        grid: { color: "rgba(100,120,160,0.06)" },
      },
      y: {
        ticks: {
          color: "#5a6880",
          font: { size: 10 },
          callback: (v) => {
            if (v >= 10000000) return `₹${(v / 10000000).toFixed(1)}Cr`;
            if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
            if (v >= 1000) return `₹${(v / 1000).toFixed(0)}K`;
            return `₹${v}`;
          },
        },
        grid: { color: "rgba(100,120,160,0.06)" },
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
  const n = parseFloat(num);
  if (isNaN(n)) return "0";
  return n.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
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
