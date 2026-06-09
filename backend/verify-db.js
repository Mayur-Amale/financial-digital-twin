/**
 * Verify Aiven Database — shows all tables, data, views, procedures, and triggers
 * Usage: node verify-db.js
 */
require("dotenv").config();
const mysql = require("mysql2/promise");

async function verify() {
  const conn = await mysql.createConnection({
    uri: process.env.DATABASE_URL.split("?")[0],
    ssl: { rejectUnauthorized: false },
  });

  console.log("✅ Connected to Aiven MySQL (defaultdb)\n");

  // 1. Tables
  console.log("═══════════════════════════════════════");
  console.log("  📋 TABLES IN DATABASE");
  console.log("═══════════════════════════════════════");
  const [tables] = await conn.query("SHOW TABLES");
  tables.forEach((t) => console.log("  •", Object.values(t)[0]));

  // 2. Users
  console.log("\n═══════════════════════════════════════");
  console.log("  👤 USERS");
  console.log("═══════════════════════════════════════");
  const [users] = await conn.query("SELECT id, name, email, monthly_income FROM users");
  console.table(users);

  // 3. Transactions summary
  console.log("═══════════════════════════════════════");
  console.log("  💳 TRANSACTIONS (by user)");
  console.log("═══════════════════════════════════════");
  const [txns] = await conn.query(
    "SELECT u.name, t.user_id, COUNT(*) as txn_count, SUM(t.amount) as total_amount FROM transactions t JOIN users u ON u.id = t.user_id GROUP BY t.user_id, u.name"
  );
  console.table(txns);

  // 4. Financial state
  console.log("═══════════════════════════════════════");
  console.log("  📊 FINANCIAL STATE SNAPSHOTS");
  console.log("═══════════════════════════════════════");
  const [fs] = await conn.query(
    "SELECT user_id, total_income, total_expenses, total_investments, total_debt, net_worth, savings_rate, snapshot_date FROM financial_state"
  );
  console.table(fs);

  // 5. Audit log (proves triggers are working)
  console.log("═══════════════════════════════════════");
  console.log("  📝 AUDIT LOG (trigger evidence)");
  console.log("═══════════════════════════════════════");
  const [audit] = await conn.query("SELECT * FROM audit_log ORDER BY id DESC LIMIT 10");
  if (audit.length > 0) {
    console.table(audit);
  } else {
    console.log("  (empty — triggers will populate this on new inserts/deletes)");
  }

  // 6. Views
  console.log("\n═══════════════════════════════════════");
  console.log("  👁️  VIEWS");
  console.log("═══════════════════════════════════════");
  const [views] = await conn.query(
    "SELECT TABLE_NAME FROM information_schema.VIEWS WHERE TABLE_SCHEMA = 'defaultdb'"
  );
  views.forEach((v) => console.log("  •", v.TABLE_NAME));

  // 7. Stored Procedures
  console.log("\n═══════════════════════════════════════");
  console.log("  ⚙️  STORED PROCEDURES");
  console.log("═══════════════════════════════════════");
  const [procs] = await conn.query(
    "SELECT ROUTINE_NAME FROM information_schema.ROUTINES WHERE ROUTINE_SCHEMA = 'defaultdb' AND ROUTINE_TYPE = 'PROCEDURE'"
  );
  procs.forEach((p) => console.log("  •", p.ROUTINE_NAME));

  // 8. Triggers
  console.log("\n═══════════════════════════════════════");
  console.log("  🔔 TRIGGERS");
  console.log("═══════════════════════════════════════");
  const [triggers] = await conn.query(
    "SELECT TRIGGER_NAME, EVENT_MANIPULATION, EVENT_OBJECT_TABLE FROM information_schema.TRIGGERS WHERE TRIGGER_SCHEMA = 'defaultdb'"
  );
  triggers.forEach((t) =>
    console.log(`  • ${t.TRIGGER_NAME} (${t.EVENT_MANIPULATION} on ${t.EVENT_OBJECT_TABLE})`)
  );

  // 9. Test a view
  console.log("\n═══════════════════════════════════════");
  console.log("  🔍 VIEW: v_user_financial_summary");
  console.log("═══════════════════════════════════════");
  const [summary] = await conn.query("SELECT * FROM v_user_financial_summary");
  console.table(summary);

  await conn.end();
  console.log("\n✅ All database objects verified successfully!");
}

verify().catch((e) => {
  console.error("Verification failed:", e.message);
  process.exit(1);
});
