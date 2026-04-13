-- ============================================
-- Financial Digital Twin — Seed Data
-- Sample data for development and testing
-- ============================================

USE financial_twin;

-- ============================================
-- Sample Users
-- ============================================
INSERT INTO users (name, email, monthly_income) VALUES
('Alice Johnson',   'alice@example.com',    75000.00),
('Bob Smith',       'bob@example.com',      50000.00),
('Charlie Lee',     'charlie@example.com',  120000.00);

-- ============================================
-- Sample Transactions for Alice (user_id = 1)
-- ============================================
INSERT INTO transactions (user_id, type, category, amount, description, transaction_date) VALUES
(1, 'income',       'salary',           75000.00,   'Monthly salary',               '2025-04-01'),
(1, 'expense',      'rent',             18000.00,   'Apartment rent',               '2025-04-02'),
(1, 'expense',      'groceries',        5000.00,    'Monthly groceries',            '2025-04-05'),
(1, 'investment',   'mutual_fund',      10000.00,   'SIP investment',               '2025-04-10'),
(1, 'debt_payment', 'education_loan',   8000.00,    'EMI payment',                  '2025-04-15'),
(1, 'expense',      'utilities',        3000.00,    'Electricity and internet',     '2025-04-18');

-- ============================================
-- Sample Transactions for Bob (user_id = 2)
-- ============================================
INSERT INTO transactions (user_id, type, category, amount, description, transaction_date) VALUES
(2, 'income',       'salary',           50000.00,   'Monthly salary',               '2025-04-01'),
(2, 'expense',      'rent',             12000.00,   'Room rent',                    '2025-04-02'),
(2, 'expense',      'food',             6000.00,    'Food and dining',              '2025-04-06'),
(2, 'debt_payment', 'personal_loan',    5000.00,    'Personal loan EMI',            '2025-04-10'),
(2, 'expense',      'transport',        2500.00,    'Metro and fuel',               '2025-04-12');

-- ============================================
-- Sample Financial State Snapshots
-- ============================================
INSERT INTO financial_state (user_id, total_income, total_expenses, total_investments, total_debt, net_worth, savings_rate, snapshot_date) VALUES
(1, 75000.00, 26000.00, 10000.00, 8000.00,  31000.00,  41.33, '2025-04-30'),
(2, 50000.00, 20500.00, 0.00,     5000.00,  24500.00,  49.00, '2025-04-30');
