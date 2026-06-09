require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const { testConnection } = require("./app/db");

// Import routes
const usersRouter = require("./routes/users");
const transactionsRouter = require("./routes/transactions");
const financialStateRouter = require("./routes/financialState");
const simulationRouter = require("./routes/simulation");
const reportsRouter = require("./routes/reports");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve frontend static files (HTML/CSS/JS)
app.use(express.static(path.join(__dirname, "..", "frontend")));

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "healthy", version: "0.1.0" });
});

// Register API routes
app.use("/api/users", usersRouter);
app.use("/api/transactions", transactionsRouter);
app.use("/api/financial-state", financialStateRouter);
app.use("/api/simulate", simulationRouter);
app.use("/api/reports", reportsRouter);

// Catch-all: serve index.html for any non-API route
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "frontend", "index.html"));
});

// Start server and connect to database
async function startServer() {
  await testConnection();
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer();

