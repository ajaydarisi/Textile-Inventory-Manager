-- TexLedger: Row Level Security Policies
-- Company-level isolation: users can only access their own company's data

-- ============================================================
-- Helper function: get the company_id for the authenticated user
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_user_company_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM public.users WHERE id = auth.uid();
$$;

-- ============================================================
-- Enable RLS on all tables
-- ============================================================
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledgers ENABLE ROW LEVEL SECURITY;
ALTER TABLE godowns ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE voucher_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- companies
-- ============================================================
CREATE POLICY "Users can view their own company"
  ON companies FOR SELECT
  USING (id = get_user_company_id());

CREATE POLICY "Users can update their own company"
  ON companies FOR UPDATE
  USING (id = get_user_company_id());

-- ============================================================
-- users
-- ============================================================
CREATE POLICY "Users can view own company users"
  ON users FOR SELECT
  USING (company_id = get_user_company_id());

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "Allow user creation during signup"
  ON users FOR INSERT
  WITH CHECK (id = auth.uid());

-- ============================================================
-- ledger_groups
-- ============================================================
CREATE POLICY "Users can view own company ledger groups"
  ON ledger_groups FOR SELECT
  USING (company_id = get_user_company_id());

CREATE POLICY "Users can insert ledger groups for own company"
  ON ledger_groups FOR INSERT
  WITH CHECK (company_id = get_user_company_id());

CREATE POLICY "Users can update own company ledger groups"
  ON ledger_groups FOR UPDATE
  USING (company_id = get_user_company_id());

CREATE POLICY "Users can delete non-system ledger groups"
  ON ledger_groups FOR DELETE
  USING (company_id = get_user_company_id() AND is_system = false);

-- ============================================================
-- ledgers
-- ============================================================
CREATE POLICY "Users can view own company ledgers"
  ON ledgers FOR SELECT
  USING (company_id = get_user_company_id());

CREATE POLICY "Users can insert ledgers for own company"
  ON ledgers FOR INSERT
  WITH CHECK (company_id = get_user_company_id());

CREATE POLICY "Users can update own company ledgers"
  ON ledgers FOR UPDATE
  USING (company_id = get_user_company_id());

CREATE POLICY "Users can delete own company ledgers"
  ON ledgers FOR DELETE
  USING (company_id = get_user_company_id());

-- ============================================================
-- godowns
-- ============================================================
CREATE POLICY "Users can view own company godowns"
  ON godowns FOR SELECT
  USING (company_id = get_user_company_id());

CREATE POLICY "Users can insert godowns for own company"
  ON godowns FOR INSERT
  WITH CHECK (company_id = get_user_company_id());

CREATE POLICY "Users can update own company godowns"
  ON godowns FOR UPDATE
  USING (company_id = get_user_company_id());

CREATE POLICY "Users can delete own company godowns"
  ON godowns FOR DELETE
  USING (company_id = get_user_company_id());

-- ============================================================
-- stock_items
-- ============================================================
CREATE POLICY "Users can view own company stock items"
  ON stock_items FOR SELECT
  USING (company_id = get_user_company_id());

CREATE POLICY "Users can insert stock items for own company"
  ON stock_items FOR INSERT
  WITH CHECK (company_id = get_user_company_id());

CREATE POLICY "Users can update own company stock items"
  ON stock_items FOR UPDATE
  USING (company_id = get_user_company_id());

CREATE POLICY "Users can delete own company stock items"
  ON stock_items FOR DELETE
  USING (company_id = get_user_company_id());

-- ============================================================
-- vouchers
-- ============================================================
CREATE POLICY "Users can view own company vouchers"
  ON vouchers FOR SELECT
  USING (company_id = get_user_company_id());

CREATE POLICY "Users can insert vouchers for own company"
  ON vouchers FOR INSERT
  WITH CHECK (company_id = get_user_company_id());

CREATE POLICY "Users can update own company vouchers"
  ON vouchers FOR UPDATE
  USING (company_id = get_user_company_id());

-- ============================================================
-- voucher_items (access via voucher's company_id)
-- ============================================================
CREATE POLICY "Users can view own company voucher items"
  ON voucher_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM vouchers v
      WHERE v.id = voucher_items.voucher_id
        AND v.company_id = get_user_company_id()
    )
  );

CREATE POLICY "Users can insert voucher items for own company"
  ON voucher_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vouchers v
      WHERE v.id = voucher_items.voucher_id
        AND v.company_id = get_user_company_id()
    )
  );

CREATE POLICY "Users can update own company voucher items"
  ON voucher_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM vouchers v
      WHERE v.id = voucher_items.voucher_id
        AND v.company_id = get_user_company_id()
    )
  );

-- ============================================================
-- journal_entries (access via voucher's company_id)
-- ============================================================
CREATE POLICY "Users can view own company journal entries"
  ON journal_entries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM vouchers v
      WHERE v.id = journal_entries.voucher_id
        AND v.company_id = get_user_company_id()
    )
  );

CREATE POLICY "Users can insert journal entries for own company"
  ON journal_entries FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vouchers v
      WHERE v.id = journal_entries.voucher_id
        AND v.company_id = get_user_company_id()
    )
  );

-- ============================================================
-- stock_movements (access via voucher's company_id)
-- ============================================================
CREATE POLICY "Users can view own company stock movements"
  ON stock_movements FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM vouchers v
      WHERE v.id = stock_movements.voucher_id
        AND v.company_id = get_user_company_id()
    )
  );

CREATE POLICY "Users can insert stock movements for own company"
  ON stock_movements FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vouchers v
      WHERE v.id = stock_movements.voucher_id
        AND v.company_id = get_user_company_id()
    )
  );

-- ============================================================
-- audit_logs
-- ============================================================
CREATE POLICY "Users can view own company audit logs"
  ON audit_logs FOR SELECT
  USING (company_id = get_user_company_id());

CREATE POLICY "System can insert audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (company_id = get_user_company_id());
