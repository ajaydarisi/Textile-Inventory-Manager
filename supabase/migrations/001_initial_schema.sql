-- TexLedger: Initial Schema
-- 11 tables for textile inventory & accounting

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. companies
-- ============================================================
CREATE TABLE companies (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        text NOT NULL,
  financial_year text NOT NULL DEFAULT '2024-2025',
  gstin       text,
  state       text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 2. users (links to auth.users)
-- ============================================================
CREATE TABLE users (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id  uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  email       text NOT NULL,
  full_name   text,
  role        text NOT NULL DEFAULT 'admin',
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_company ON users(company_id);

-- ============================================================
-- 3. ledger_groups
-- ============================================================
CREATE TABLE ledger_groups (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id  uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name        text NOT NULL,
  parent_id   uuid REFERENCES ledger_groups(id) ON DELETE SET NULL,
  nature      text NOT NULL CHECK (nature IN ('Asset', 'Liability', 'Income', 'Expense')),
  is_system   boolean NOT NULL DEFAULT false,
  UNIQUE (company_id, name)
);

CREATE INDEX idx_ledger_groups_company ON ledger_groups(company_id);

-- ============================================================
-- 4. ledgers
-- ============================================================
CREATE TABLE ledgers (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id      uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name            text NOT NULL,
  ledger_group_id uuid NOT NULL REFERENCES ledger_groups(id) ON DELETE RESTRICT,
  gstin           text,
  opening_balance numeric(15, 2) NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, name)
);

CREATE INDEX idx_ledgers_company ON ledgers(company_id);
CREATE INDEX idx_ledgers_group ON ledgers(ledger_group_id);

-- ============================================================
-- 5. godowns
-- ============================================================
CREATE TABLE godowns (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id  uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name        text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, name)
);

CREATE INDEX idx_godowns_company ON godowns(company_id);

-- ============================================================
-- 6. stock_items
-- ============================================================
CREATE TABLE stock_items (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id  uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name        text NOT NULL,
  article_no  text,
  category    text,
  unit        text NOT NULL DEFAULT 'Meters',
  gst_rate    numeric(5, 2) NOT NULL DEFAULT 5.00,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, name)
);

CREATE INDEX idx_stock_items_company ON stock_items(company_id);

-- ============================================================
-- 7. vouchers
-- ============================================================
CREATE TABLE vouchers (
  id                uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id        uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  type              text NOT NULL CHECK (type IN ('PURCHASE', 'SALES', 'RECEIPT', 'PAYMENT')),
  number            integer NOT NULL,
  date              date NOT NULL DEFAULT CURRENT_DATE,
  party_ledger_id   uuid NOT NULL REFERENCES ledgers(id) ON DELETE RESTRICT,
  account_ledger_id uuid REFERENCES ledgers(id) ON DELETE RESTRICT,
  sub_total         numeric(15, 2) NOT NULL DEFAULT 0,
  gst_total         numeric(15, 2) NOT NULL DEFAULT 0,
  discount          numeric(15, 2) NOT NULL DEFAULT 0,
  freight           numeric(15, 2) NOT NULL DEFAULT 0,
  grand_total       numeric(15, 2) NOT NULL DEFAULT 0,
  narration         text,
  created_by        uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, type, number)
);

CREATE INDEX idx_vouchers_company ON vouchers(company_id);
CREATE INDEX idx_vouchers_type ON vouchers(company_id, type);
CREATE INDEX idx_vouchers_date ON vouchers(company_id, date);
CREATE INDEX idx_vouchers_party ON vouchers(party_ledger_id);

-- ============================================================
-- 8. voucher_items (line items for inventory vouchers)
-- ============================================================
CREATE TABLE voucher_items (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  voucher_id    uuid NOT NULL REFERENCES vouchers(id) ON DELETE CASCADE,
  stock_item_id uuid NOT NULL REFERENCES stock_items(id) ON DELETE RESTRICT,
  shade         text,
  lot           text,
  quantity      numeric(12, 3) NOT NULL DEFAULT 0,
  rate          numeric(12, 2) NOT NULL DEFAULT 0,
  amount        numeric(15, 2) NOT NULL DEFAULT 0,
  gst_amount    numeric(15, 2) NOT NULL DEFAULT 0
);

CREATE INDEX idx_voucher_items_voucher ON voucher_items(voucher_id);
CREATE INDEX idx_voucher_items_stock ON voucher_items(stock_item_id);

-- ============================================================
-- 9. journal_entries (double-entry bookkeeping)
-- ============================================================
CREATE TABLE journal_entries (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  voucher_id  uuid NOT NULL REFERENCES vouchers(id) ON DELETE CASCADE,
  ledger_id   uuid NOT NULL REFERENCES ledgers(id) ON DELETE RESTRICT,
  debit       numeric(15, 2) NOT NULL DEFAULT 0,
  credit      numeric(15, 2) NOT NULL DEFAULT 0,
  CHECK (debit >= 0 AND credit >= 0),
  CHECK (NOT (debit > 0 AND credit > 0))
);

CREATE INDEX idx_journal_entries_voucher ON journal_entries(voucher_id);
CREATE INDEX idx_journal_entries_ledger ON journal_entries(ledger_id);

-- ============================================================
-- 10. stock_movements (inventory IN/OUT tracking)
-- ============================================================
CREATE TABLE stock_movements (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  voucher_id    uuid NOT NULL REFERENCES vouchers(id) ON DELETE CASCADE,
  stock_item_id uuid NOT NULL REFERENCES stock_items(id) ON DELETE RESTRICT,
  godown_id     uuid REFERENCES godowns(id) ON DELETE SET NULL,
  shade         text,
  lot           text,
  quantity      numeric(12, 3) NOT NULL CHECK (quantity > 0),
  movement_type text NOT NULL CHECK (movement_type IN ('IN', 'OUT')),
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_stock_movements_voucher ON stock_movements(voucher_id);
CREATE INDEX idx_stock_movements_item ON stock_movements(stock_item_id);
CREATE INDEX idx_stock_movements_godown ON stock_movements(godown_id);

-- ============================================================
-- 11. audit_logs
-- ============================================================
CREATE TABLE audit_logs (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id  uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  table_name  text NOT NULL,
  record_id   text NOT NULL,
  action      text NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  old_data    jsonb,
  new_data    jsonb,
  user_id     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_logs_company ON audit_logs(company_id);
CREATE INDEX idx_audit_logs_table ON audit_logs(table_name);
CREATE INDEX idx_audit_logs_record ON audit_logs(record_id);
