-- ============================================
-- Financial Digital Twin — Database Schema
-- Database: MySQL
-- Normalized to 3NF
-- ============================================

-- Create the database
CREATE DATABASE IF NOT EXISTS financial_twin;
USE financial_twin;

-- ============================================
-- 1. USERS TABLE
-- Stores basic user profile and income info
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id              INT             AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(100)    NOT NULL,
    email           VARCHAR(150)    NOT NULL UNIQUE,
    monthly_income  DECIMAL(12, 2)  NOT NULL DEFAULT 0.00,
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
);

-- Index: fast lookups by email
CREATE INDEX idx_users_email ON users (email);


-- ============================================
-- 2. TRANSACTIONS TABLE
-- Records every financial event for a user
-- ============================================
CREATE TABLE IF NOT EXISTS transactions (
    id                  INT             AUTO_INCREMENT PRIMARY KEY,
    user_id             INT             NOT NULL,
    type                ENUM('income', 'expense', 'investment', 'debt_payment') NOT NULL,
    category            VARCHAR(50)     NOT NULL,
    amount              DECIMAL(12, 2)  NOT NULL,
    description         VARCHAR(255)    DEFAULT NULL,
    transaction_date    DATE            NOT NULL,
    created_at          TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,

    -- Foreign key to users
    CONSTRAINT fk_transactions_user
        FOREIGN KEY (user_id) REFERENCES users (id)
        ON DELETE CASCADE
);

-- Index: filter transactions by user
CREATE INDEX idx_transactions_user_id ON transactions (user_id);

-- Index: range queries on date
CREATE INDEX idx_transactions_date ON transactions (transaction_date);

-- Composite index: user + date (common query pattern)
CREATE INDEX idx_transactions_user_date ON transactions (user_id, transaction_date);


-- ============================================
-- 3. FINANCIAL_STATE TABLE
-- Point-in-time snapshot of a user's finances
-- ============================================
CREATE TABLE IF NOT EXISTS financial_state (
    id                  INT             AUTO_INCREMENT PRIMARY KEY,
    user_id             INT             NOT NULL,
    total_income        DECIMAL(12, 2)  NOT NULL DEFAULT 0.00,
    total_expenses      DECIMAL(12, 2)  NOT NULL DEFAULT 0.00,
    total_investments   DECIMAL(12, 2)  NOT NULL DEFAULT 0.00,
    total_debt          DECIMAL(12, 2)  NOT NULL DEFAULT 0.00,
    net_worth           DECIMAL(12, 2)  NOT NULL DEFAULT 0.00,
    savings_rate        DECIMAL(5, 2)   NOT NULL DEFAULT 0.00,
    snapshot_date       DATE            NOT NULL,
    created_at          TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,

    -- Foreign key to users
    CONSTRAINT fk_financial_state_user
        FOREIGN KEY (user_id) REFERENCES users (id)
        ON DELETE CASCADE
);

-- Index: filter snapshots by user
CREATE INDEX idx_financial_state_user_id ON financial_state (user_id);

-- Index: range queries on snapshot date
CREATE INDEX idx_financial_state_date ON financial_state (snapshot_date);

-- Composite index: user + snapshot date (for time-series queries)
CREATE INDEX idx_financial_state_user_date ON financial_state (user_id, snapshot_date);
