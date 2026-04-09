# Architecture Overview

## Financial Digital Twin (FDT) with Antigravity Economics

### System Components

```
┌─────────────┐     ┌─────────────┐     ┌──────────────┐
│  Frontend    │────▶│  Backend    │────▶│    MySQL      │
│  HTML/CSS/JS │◀────│  Express.js │◀────│   Database    │
└─────────────┘     └─────────────┘     └──────────────┘
```

### Backend (Node.js / Express)
- REST API for user management, transactions, and simulations
- Financial state calculation engine
- Simulation engine (normal + antigravity modes)

### Frontend (HTML / CSS / JS)
- Dashboard displaying financial twin data
- Simulation controls and result visualization

### Database (MySQL)
- Users, Transactions, Financial_State tables
- Triggers for automatic financial state updates
- Views for aggregated reporting
- Stored procedures for simulation logic

### Antigravity Economics Module
- Debt inversion: flips debt into virtual assets
- Constraint removal: removes spending/income caps
- Zero-risk simulation: eliminates downside risk from projections
