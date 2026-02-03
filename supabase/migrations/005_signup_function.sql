-- TexLedger: User Account Creation
-- Called during signup to atomically create company + user profile + default data

CREATE OR REPLACE FUNCTION public.create_user_account(
  p_company_name text,
  p_full_name    text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id    uuid;
  v_email      text;
  v_company_id uuid;
BEGIN
  -- Get the authenticated user's ID and email
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Check if user already has an account
  IF EXISTS (SELECT 1 FROM users WHERE id = v_user_id) THEN
    RAISE EXCEPTION 'Account already exists';
  END IF;

  -- Get email from auth.users
  SELECT email INTO v_email FROM auth.users WHERE id = v_user_id;

  -- Create the company
  INSERT INTO companies (name)
  VALUES (p_company_name)
  RETURNING id INTO v_company_id;

  -- Create the user profile
  INSERT INTO users (id, company_id, email, full_name, role)
  VALUES (v_user_id, v_company_id, v_email, p_full_name, 'admin');

  -- Seed default ledger groups for the new company
  INSERT INTO ledger_groups (company_id, name, nature, is_system) VALUES
    (v_company_id, 'Sundry Debtors',    'Asset',     true),
    (v_company_id, 'Sundry Creditors',  'Liability', true),
    (v_company_id, 'Sales Account',     'Income',    true),
    (v_company_id, 'Purchase Account',  'Expense',   true),
    (v_company_id, 'Cash',              'Asset',     true),
    (v_company_id, 'Bank',              'Asset',     true),
    (v_company_id, 'Duties & Taxes',    'Liability', true),
    (v_company_id, 'Direct Expenses',   'Expense',   true),
    (v_company_id, 'Capital Account',   'Liability', true);

  -- Seed default ledgers (Cash, Bank, Sales, Purchases, GST)
  INSERT INTO ledgers (company_id, name, ledger_group_id)
  SELECT v_company_id, 'Sales',
    id FROM ledger_groups WHERE company_id = v_company_id AND name = 'Sales Account' LIMIT 1;

  INSERT INTO ledgers (company_id, name, ledger_group_id)
  SELECT v_company_id, 'Purchases',
    id FROM ledger_groups WHERE company_id = v_company_id AND name = 'Purchase Account' LIMIT 1;

  INSERT INTO ledgers (company_id, name, ledger_group_id)
  SELECT v_company_id, 'Cash in Hand',
    id FROM ledger_groups WHERE company_id = v_company_id AND name = 'Cash' LIMIT 1;

  INSERT INTO ledgers (company_id, name, ledger_group_id)
  SELECT v_company_id, 'Bank Account',
    id FROM ledger_groups WHERE company_id = v_company_id AND name = 'Bank' LIMIT 1;

  INSERT INTO ledgers (company_id, name, ledger_group_id)
  SELECT v_company_id, 'GST Payable',
    id FROM ledger_groups WHERE company_id = v_company_id AND name = 'Duties & Taxes' LIMIT 1;

  -- Seed default godown
  INSERT INTO godowns (company_id, name)
  VALUES (v_company_id, 'Main Warehouse');

  RETURN v_company_id;
END;
$$;

-- Also add INSERT policy for companies (needed if calling outside SECURITY DEFINER context)
CREATE POLICY "Authenticated users can create a company"
  ON companies FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
