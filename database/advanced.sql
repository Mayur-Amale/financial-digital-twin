-- ============================================================
-- Financial Digital Twin — Advanced DBMS Features
-- Triggers · Views · Stored Procedures
-- Run AFTER schema.sql and seed.sql
-- ============================================================

USE financial_twin;


-- ============================================================
-- SECTION 1: VIEWS
-- ============================================================

-- ------------------------------------------------------------
-- VIEW: v_user_financial_summary
-- Joins each user with their most recent financial state snapshot.
-- Use: Quick dashboard overview per user.
-- ------------------------------------------------------------
DROP VIEW IF EXISTS v_user_financial_summary;

CREATE VIEW v_user_financial_summary AS
SELECT
    u.id              AS user_id,
    u.name,
    u.email,
    u.monthly_income,
    fs.total_income,
    fs.total_expenses,
    fs.total_investments,
    fs.total_debt,
    fs.net_worth,
    fs.savings_rate,
    fs.snapshot_date,
    fs.created_at     AS snapshot_created_at
FROM users u
LEFT JOIN financial_state fs ON fs.id = (
    SELECT fs2.id
    FROM financial_state fs2
    WHERE fs2.user_id = u.id
    ORDER BY fs2.snapshot_date DESC
    LIMIT 1
);


-- ------------------------------------------------------------
-- VIEW: v_monthly_spending
-- Aggregates expenses by user, year-month, and category.
-- Use: "Where is my money going?" reports.
-- ------------------------------------------------------------
DROP VIEW IF EXISTS v_monthly_spending;

CREATE VIEW v_monthly_spending AS
SELECT
    t.user_id,
    u.name                                          AS user_name,
    DATE_FORMAT(t.transaction_date, '%Y-%m')        AS month,
    t.category,
    t.type,
    COUNT(*)                                        AS txn_count,
    SUM(t.amount)                                   AS total_amount,
    ROUND(AVG(t.amount), 2)                         AS avg_amount
FROM transactions t
JOIN users u ON u.id = t.user_id
GROUP BY t.user_id, u.name, DATE_FORMAT(t.transaction_date, '%Y-%m'), t.category, t.type
ORDER BY t.user_id, month DESC, total_amount DESC;


-- ------------------------------------------------------------
-- VIEW: v_transaction_stats
-- Per-user aggregated transaction statistics by type.
-- Use: Overview of total income vs total expenses vs debt.
-- ------------------------------------------------------------
DROP VIEW IF EXISTS v_transaction_stats;

CREATE VIEW v_transaction_stats AS
SELECT
    t.user_id,
    u.name                                          AS user_name,
    t.type,
    COUNT(*)                                        AS txn_count,
    SUM(t.amount)                                   AS total_amount,
    ROUND(AVG(t.amount), 2)                         AS avg_amount,
    MIN(t.amount)                                   AS min_amount,
    MAX(t.amount)                                   AS max_amount,
    MIN(t.transaction_date)                         AS first_txn_date,
    MAX(t.transaction_date)                         AS last_txn_date
FROM transactions t
JOIN users u ON u.id = t.user_id
GROUP BY t.user_id, u.name, t.type
ORDER BY t.user_id, t.type;


-- ============================================================
-- SECTION 2: STORED PROCEDURES
-- ============================================================

-- ------------------------------------------------------------
-- PROCEDURE: sp_calculate_financial_state
-- Aggregates transactions for a user within a date range,
-- computes financial metrics, and saves a snapshot.
-- Returns the newly created snapshot.
-- ------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_calculate_financial_state;

DELIMITER //

CREATE PROCEDURE sp_calculate_financial_state(
    IN p_user_id      INT,
    IN p_start_date   DATE,
    IN p_end_date     DATE
)
BEGIN
    DECLARE v_total_income       DECIMAL(12,2) DEFAULT 0;
    DECLARE v_total_expenses     DECIMAL(12,2) DEFAULT 0;
    DECLARE v_total_investments  DECIMAL(12,2) DEFAULT 0;
    DECLARE v_total_debt         DECIMAL(12,2) DEFAULT 0;
    DECLARE v_net_worth          DECIMAL(12,2) DEFAULT 0;
    DECLARE v_savings_rate       DECIMAL(5,2)  DEFAULT 0;

    -- Aggregate income
    SELECT COALESCE(SUM(amount), 0) INTO v_total_income
    FROM transactions
    WHERE user_id = p_user_id
      AND type = 'income'
      AND transaction_date BETWEEN p_start_date AND p_end_date;

    -- Aggregate expenses
    SELECT COALESCE(SUM(amount), 0) INTO v_total_expenses
    FROM transactions
    WHERE user_id = p_user_id
      AND type = 'expense'
      AND transaction_date BETWEEN p_start_date AND p_end_date;

    -- Aggregate investments
    SELECT COALESCE(SUM(amount), 0) INTO v_total_investments
    FROM transactions
    WHERE user_id = p_user_id
      AND type = 'investment'
      AND transaction_date BETWEEN p_start_date AND p_end_date;

    -- Aggregate debt payments
    SELECT COALESCE(SUM(amount), 0) INTO v_total_debt
    FROM transactions
    WHERE user_id = p_user_id
      AND type = 'debt_payment'
      AND transaction_date BETWEEN p_start_date AND p_end_date;

    -- Calculate net worth
    SET v_net_worth = v_total_income - v_total_expenses - v_total_debt + v_total_investments;

    -- Calculate savings rate
    IF v_total_income > 0 THEN
        SET v_savings_rate = ROUND(((v_total_income - v_total_expenses - v_total_debt) / v_total_income) * 100, 2);
    END IF;

    -- Insert the snapshot
    INSERT INTO financial_state
        (user_id, total_income, total_expenses, total_investments, total_debt, net_worth, savings_rate, snapshot_date)
    VALUES
        (p_user_id, v_total_income, v_total_expenses, v_total_investments, v_total_debt, v_net_worth, v_savings_rate, p_end_date);

    -- Return the new snapshot
    SELECT * FROM financial_state WHERE id = LAST_INSERT_ID();
END //

DELIMITER ;


-- ------------------------------------------------------------
-- PROCEDURE: sp_get_user_dashboard
-- Returns all dashboard data for a user in one call:
--   Result 1: User info
--   Result 2: Latest financial state
--   Result 3: Recent transactions (last 20)
--   Result 4: Transaction stats by type
-- ------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_get_user_dashboard;

DELIMITER //

CREATE PROCEDURE sp_get_user_dashboard(
    IN p_user_id INT
)
BEGIN
    -- Result 1: User info
    SELECT id, name, email, monthly_income, created_at
    FROM users
    WHERE id = p_user_id;

    -- Result 2: Latest financial state
    SELECT *
    FROM financial_state
    WHERE user_id = p_user_id
    ORDER BY snapshot_date DESC
    LIMIT 1;

    -- Result 3: Recent transactions
    SELECT *
    FROM transactions
    WHERE user_id = p_user_id
    ORDER BY transaction_date DESC
    LIMIT 20;

    -- Result 4: Transaction stats
    SELECT
        type,
        COUNT(*)           AS txn_count,
        SUM(amount)        AS total_amount,
        ROUND(AVG(amount), 2) AS avg_amount
    FROM transactions
    WHERE user_id = p_user_id
    GROUP BY type;
END //

DELIMITER ;


-- ------------------------------------------------------------
-- PROCEDURE: sp_monthly_report
-- Generates a monthly financial report for a user.
-- Returns spending by category for the given month.
-- ------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_monthly_report;

DELIMITER //

CREATE PROCEDURE sp_monthly_report(
    IN p_user_id    INT,
    IN p_year       INT,
    IN p_month      INT
)
BEGIN
    DECLARE v_start_date DATE;
    DECLARE v_end_date   DATE;

    SET v_start_date = CONCAT(p_year, '-', LPAD(p_month, 2, '0'), '-01');
    SET v_end_date   = LAST_DAY(v_start_date);

    -- Summary by type
    SELECT
        type,
        COUNT(*)            AS txn_count,
        SUM(amount)         AS total_amount
    FROM transactions
    WHERE user_id = p_user_id
      AND transaction_date BETWEEN v_start_date AND v_end_date
    GROUP BY type;

    -- Detail by category
    SELECT
        type,
        category,
        COUNT(*)            AS txn_count,
        SUM(amount)         AS total_amount,
        ROUND(AVG(amount), 2) AS avg_amount
    FROM transactions
    WHERE user_id = p_user_id
      AND transaction_date BETWEEN v_start_date AND v_end_date
    GROUP BY type, category
    ORDER BY total_amount DESC;
END //

DELIMITER ;


-- ============================================================
-- SECTION 3: TRIGGERS
-- ============================================================

-- ------------------------------------------------------------
-- TRIGGER: trg_after_transaction_insert
-- After a new transaction is inserted, log a message.
-- (MySQL triggers cannot call stored procedures that return
--  result sets, so we insert an audit record instead.)
-- ------------------------------------------------------------

-- Audit log table for trigger tracking
CREATE TABLE IF NOT EXISTS audit_log (
    id          INT             AUTO_INCREMENT PRIMARY KEY,
    table_name  VARCHAR(50)     NOT NULL,
    action      VARCHAR(20)     NOT NULL,
    record_id   INT             NOT NULL,
    user_id     INT             NOT NULL,
    details     VARCHAR(255)    DEFAULT NULL,
    created_at  TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_user ON audit_log (user_id);
CREATE INDEX idx_audit_table ON audit_log (table_name);

DROP TRIGGER IF EXISTS trg_after_transaction_insert;

DELIMITER //

CREATE TRIGGER trg_after_transaction_insert
AFTER INSERT ON transactions
FOR EACH ROW
BEGIN
    -- Log the transaction insert to audit_log
    INSERT INTO audit_log (table_name, action, record_id, user_id, details)
    VALUES (
        'transactions',
        'INSERT',
        NEW.id,
        NEW.user_id,
        CONCAT(NEW.type, ': ', NEW.category, ' - ', NEW.amount)
    );
END //

DELIMITER ;


-- ------------------------------------------------------------
-- TRIGGER: trg_after_transaction_delete
-- Logs when a transaction is deleted.
-- ------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_after_transaction_delete;

DELIMITER //

CREATE TRIGGER trg_after_transaction_delete
AFTER DELETE ON transactions
FOR EACH ROW
BEGIN
    INSERT INTO audit_log (table_name, action, record_id, user_id, details)
    VALUES (
        'transactions',
        'DELETE',
        OLD.id,
        OLD.user_id,
        CONCAT(OLD.type, ': ', OLD.category, ' - ', OLD.amount)
    );
END //

DELIMITER ;


-- ------------------------------------------------------------
-- TRIGGER: trg_before_user_delete
-- Logs user deletion before it happens (rows will be
-- cascade-deleted from transactions and financial_state).
-- ------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_before_user_delete;

DELIMITER //

CREATE TRIGGER trg_before_user_delete
BEFORE DELETE ON users
FOR EACH ROW
BEGIN
    INSERT INTO audit_log (table_name, action, record_id, user_id, details)
    VALUES (
        'users',
        'DELETE',
        OLD.id,
        OLD.id,
        CONCAT('User deleted: ', OLD.name, ' (', OLD.email, ')')
    );
END //

DELIMITER ;
