# Financial Digital Twin (FDT) with Antigravity Economics

A fintech system that creates a virtual model of a user's financial life and simulates future financial outcomes based on real-time data and user-defined scenarios.

## Features

- **Financial Digital Twin** — Track your financial state over time
- **Scenario Simulation** — Simulate different financial decisions
- **Antigravity Economics** — Remove financial constraints, invert debt pressure, and explore zero-risk scenarios
- **Comparison Mode** — Compare normal vs constraint-free outcomes
- **Advanced DBMS** — Triggers, Views, and Stored Procedures for data integrity and reporting

## Tech Stack

| Layer    | Technology          |
|----------|---------------------|
| Backend  | Node.js (Express)   |
| Database | MySQL               |
| Frontend | HTML / CSS / JS     |

## Project Structure

```
financial-digital-twin/
├── backend/
│   ├── app/
│   │   ├── db.js                    # MySQL connection pool
│   │   ├── financialCalculator.js   # Financial state calculations
│   │   └── simulationEngine.js      # Normal + Antigravity engines
│   ├── routes/
│   │   ├── users.js                 # User CRUD
│   │   ├── transactions.js          # Transaction CRUD
│   │   ├── financialState.js        # Financial snapshots
│   │   ├── simulation.js            # Simulation endpoints
│   │   └── reports.js               # Views, procedures, audit
│   ├── main.js                      # Express entry point
│   └── package.json
├── frontend/
│   ├── index.html                   # Dashboard UI
│   ├── styles.css                   # Dark theme styles
│   └── script.js                    # Frontend logic + charts
├── database/
│   ├── schema.sql                   # Core tables
│   ├── seed.sql                     # Sample data
│   └── advanced.sql                 # Triggers, views, procedures
├── docs/
│   └── architecture.md
└── README.md
```

## Setup

### 1. Database

```bash
mysql -u root -p < database/schema.sql
mysql -u root -p < database/seed.sql
mysql -u root -p < database/advanced.sql
```

### 2. Backend

```bash
cd backend
npm install
npm run dev
```

API available at `http://localhost:3000`

### 3. Frontend

Open `frontend/index.html` in your browser.

## API Endpoints

### Users
| Method | Endpoint           | Description          |
|--------|--------------------|----------------------|
| POST   | `/api/users`       | Create a user        |
| GET    | `/api/users`       | Get all users        |
| GET    | `/api/users/:id`   | Get user by ID       |

### Transactions
| Method | Endpoint                    | Description                  |
|--------|-----------------------------|------------------------------|
| POST   | `/api/transactions`         | Add a transaction            |
| GET    | `/api/transactions/:userId` | Get user's transactions      |

### Financial State
| Method | Endpoint                              | Description                    |
|--------|---------------------------------------|--------------------------------|
| POST   | `/api/financial-state/calculate`      | Calculate & save snapshot      |
| GET    | `/api/financial-state/:userId`        | All snapshots for user         |
| GET    | `/api/financial-state/:userId/latest` | Latest snapshot                |

### Simulation
| Method | Endpoint                    | Description                    |
|--------|-----------------------------|--------------------------------|
| POST   | `/api/simulate/normal`      | Run normal simulation          |
| POST   | `/api/simulate/antigravity` | Run antigravity simulation     |
| POST   | `/api/simulate/compare`     | Compare normal vs antigravity  |

### Reports (Views & Procedures)
| Method | Endpoint                                     | Description                        |
|--------|----------------------------------------------|------------------------------------|
| GET    | `/api/reports/summary`                       | All users' financial summaries     |
| GET    | `/api/reports/spending/:userId`              | Monthly spending breakdown         |
| GET    | `/api/reports/stats/:userId`                 | Transaction stats by type          |
| POST   | `/api/reports/calculate`                     | Calculate state (stored procedure) |
| GET    | `/api/reports/dashboard/:userId`             | Full dashboard data (procedure)    |
| GET    | `/api/reports/monthly/:userId/:year/:month`  | Monthly report (procedure)         |
| GET    | `/api/reports/audit`                         | Recent audit log entries           |
| GET    | `/api/reports/audit/:userId`                 | Audit log for a user               |

## License

MIT
