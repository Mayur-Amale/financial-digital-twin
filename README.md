# Financial Digital Twin (FDT) with Antigravity Economics

A fintech system that creates a virtual model of a user's financial life and simulates future financial outcomes based on real-time data and user-defined scenarios.

## Features

- **Financial Digital Twin** — Track your financial state over time
- **Scenario Simulation** — Simulate different financial decisions
- **Antigravity Economics** — Remove financial constraints, invert debt pressure, and explore zero-risk scenarios
- **Comparison Mode** — Compare normal vs constraint-free outcomes

## Tech Stack

| Layer    | Technology          |
|----------|---------------------|
| Backend  | Node.js (Express)   |
| Database | MySQL               |
| Frontend | HTML / CSS / JS     |

## Project Structure

```
financial-digital-twin/
├── backend/         # Express server, routes, models
├── frontend/        # HTML/CSS/JS dashboard
├── database/        # SQL schema and seed data
├── docs/            # Architecture documentation
└── README.md
```

## Setup

### Backend

```bash
cd backend
npm install
npm run dev
```

The API will be available at `http://localhost:3000`.

### API Endpoints

| Method | Endpoint  | Description              |
|--------|-----------|--------------------------|
| GET    | `/`       | Root — server status     |
| GET    | `/health` | Health check             |

## License

MIT
