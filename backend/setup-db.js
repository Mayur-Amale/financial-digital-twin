/**
 * Database Setup Script
 * Runs schema creation, seed data, and advanced features against the cloud DB.
 * Usage: node setup-db.js
 */
require("dotenv").config();
const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");

async function runSetup() {
  const conn = await mysql.createConnection({
    uri: process.env.DATABASE_URL.split("?")[0],
    ssl: { rejectUnauthorized: false },
    multipleStatements: true,
  });

  console.log("Connected to Aiven MySQL (defaultdb)\n");

  // --- 1. Run schema.sql ---
  console.log("=== Running schema.sql ===");
  let schema = fs.readFileSync(
    path.join(__dirname, "..", "database", "schema.sql"),
    "utf8"
  );
  // Remove CREATE DATABASE / USE statements (we're already in defaultdb)
  schema = schema
    .replace(/CREATE DATABASE IF NOT EXISTS financial_twin;\s*/gi, "")
    .replace(/USE financial_twin;\s*/gi, "");
  await conn.query(schema);
  console.log("Schema created successfully.\n");

  // --- 2. Run seed.sql ---
  console.log("=== Running seed.sql ===");
  let seed = fs.readFileSync(
    path.join(__dirname, "..", "database", "seed.sql"),
    "utf8"
  );
  seed = seed.replace(/USE financial_twin;\s*/gi, "");
  try {
    await conn.query(seed);
    console.log("Seed data inserted successfully.\n");
  } catch (e) {
    if (e.code === "ER_DUP_ENTRY") {
      console.log("Seed data already exists (duplicate entries). Skipping.\n");
    } else {
      throw e;
    }
  }

  // --- 3. Run advanced.sql (views, procedures, triggers) ---
  // advanced.sql uses DELIMITER which is a mysql client command, not valid in Node.js.
  // We need to run each statement separately.
  console.log("=== Running advanced.sql (views, procedures, triggers) ===");
  let advanced = fs.readFileSync(
    path.join(__dirname, "..", "database", "advanced.sql"),
    "utf8"
  );
  advanced = advanced.replace(/USE financial_twin;\s*/gi, "");

  // Remove DELIMITER directives and split by them
  // Replace DELIMITER // ... DELIMITER ; blocks
  // Strategy: convert DELIMITER-wrapped blocks into single statements
  const blocks = [];

  // Extract non-DELIMITER statements and DELIMITER blocks
  const lines = advanced.split("\n");
  let inDelimiterBlock = false;
  let currentBlock = [];

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed === "DELIMITER //") {
      inDelimiterBlock = true;
      currentBlock = [];
      continue;
    }

    if (trimmed === "DELIMITER ;") {
      inDelimiterBlock = false;
      // Join the block and remove trailing //
      let block = currentBlock.join("\n").trim();
      if (block.endsWith("//")) {
        block = block.slice(0, -2).trim();
      }
      if (block) blocks.push(block);
      continue;
    }

    if (inDelimiterBlock) {
      currentBlock.push(line);
    } else {
      // Regular statement outside DELIMITER blocks
      if (trimmed && !trimmed.startsWith("--")) {
        // Accumulate until we hit a semicolon
        if (!blocks._currentRegular) blocks._currentRegular = [];
        blocks._currentRegular.push(line);
        if (trimmed.endsWith(";")) {
          const stmt = blocks._currentRegular.join("\n").trim();
          if (stmt && stmt !== ";") blocks.push(stmt);
          blocks._currentRegular = [];
        }
      }
    }
  }

  for (let i = 0; i < blocks.length; i++) {
    const stmt = blocks[i];
    if (!stmt || stmt === ";") continue;
    try {
      await conn.query(stmt);
      // Determine what we just created
      const firstLine = stmt.split("\n")[0].trim().toUpperCase();
      if (firstLine.includes("VIEW")) console.log(`  ✓ View created/replaced`);
      else if (firstLine.includes("PROCEDURE"))
        console.log(`  ✓ Procedure created/replaced`);
      else if (firstLine.includes("TRIGGER"))
        console.log(`  ✓ Trigger created/replaced`);
      else if (firstLine.includes("TABLE"))
        console.log(`  ✓ Table created`);
      else if (firstLine.includes("INDEX"))
        console.log(`  ✓ Index created`);
      else if (firstLine.includes("DROP"))
        console.log(`  ✓ Dropped old object`);
      else console.log(`  ✓ Statement executed`);
    } catch (e) {
      console.error(`  ✗ Error: ${e.message}`);
      console.error(`    Statement: ${stmt.substring(0, 80)}...`);
    }
  }

  console.log("\n=== Verification ===");

  // Verify tables
  const [tables] = await conn.query("SHOW TABLES");
  console.log(
    "Tables:",
    tables.map((t) => Object.values(t)[0])
  );

  // Verify user count
  const [users] = await conn.query("SELECT COUNT(*) as count FROM users");
  console.log("Users seeded:", users[0].count);

  // Verify transaction count
  const [txns] = await conn.query(
    "SELECT COUNT(*) as count FROM transactions"
  );
  console.log("Transactions seeded:", txns[0].count);

  await conn.end();
  console.log("\n✅ Database setup complete!");
}

runSetup().catch((e) => {
  console.error("Setup failed:", e);
  process.exit(1);
});
