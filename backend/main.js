const express = require("express");
const cors = require("cors");
const { testConnection } = require("./app/db");

// Import routes
const usersRouter = require("./routes/users");
const transactionsRouter = require("./routes/transactions");

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Root endpoint — confirms the server is running
app.get("/", (req, res) => {
  res.json({ message: "Financial Digital Twin API is running" });
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "healthy", version: "0.1.0" });
});

// Register API routes
app.use("/api/users", usersRouter);
app.use("/api/transactions", transactionsRouter);

// Start server and connect to database
async function startServer() {
  await testConnection();
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer();
