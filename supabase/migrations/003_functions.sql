-- TexLedger: RPC Functions
-- Atomic voucher creation, balance queries, stock summary, voucher numbering

-- ============================================================
-- get_next_voucher_number
-- Returns the next sequential voucher number for a given type
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_next_voucher_number(
  p_company_id uuid,
  p_type text
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_next integer;
BEGIN
  SELECT COALESCE(MAX(number), 0) + 1
    INTO v_next
    FROM vouchers
   WHERE company_id = p_company_id
     AND type = p_type;
  RETURN v_next;
END;
$$;

-- ============================================================
-- get_ledger_balance
-- Net balance = SUM(debit) - SUM(credit) + opening_balance
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_ledger_balance(
  p_ledger_id uuid
)
RETURNS numeric
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_opening numeric;
  v_debits  numeric;
  v_credits numeric;
BEGIN
  SELECT opening_balance INTO v_opening
    FROM ledgers WHERE id = p_ledger_id;

  SELECT COALESCE(SUM(debit), 0), COALESCE(SUM(credit), 0)
    INTO v_debits, v_credits
    FROM journal_entries
   WHERE ledger_id = p_ledger_id;

  RETURN v_opening + v_debits - v_credits;
END;
$$;

-- ============================================================
-- get_stock_summary
-- Current quantity per stock item (IN - OUT)
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_stock_summary(
  p_company_id uuid
)
RETURNS TABLE (
  stock_item_id uuid,
  item_name     text,
  category      text,
  unit          text,
  current_qty   numeric
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    si.id AS stock_item_id,
    si.name AS item_name,
    COALESCE(si.category, '') AS category,
    si.unit,
    COALESCE(
      SUM(CASE WHEN sm.movement_type = 'IN' THEN sm.quantity ELSE 0 END) -
      SUM(CASE WHEN sm.movement_type = 'OUT' THEN sm.quantity ELSE 0 END),
      0
    ) AS current_qty
  FROM stock_items si
  LEFT JOIN stock_movements sm ON sm.stock_item_id = si.id
  WHERE si.company_id = p_company_id
  GROUP BY si.id, si.name, si.category, si.unit
  ORDER BY si.name;
END;
$$;

-- ============================================================
-- create_voucher
-- Atomic: creates voucher + line items + journal entries + stock movements
-- ============================================================
CREATE OR REPLACE FUNCTION public.create_voucher(
  p_company_id        uuid,
  p_type              text,
  p_date              text,
  p_party_ledger_id   uuid,
  p_account_ledger_id uuid,
  p_items             jsonb,
  p_sub_total         numeric,
  p_gst_total         numeric,
  p_discount          numeric,
  p_freight           numeric,
  p_grand_total       numeric,
  p_narration         text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_voucher_id  uuid;
  v_number      integer;
  v_item        jsonb;
  v_gst_ledger_id uuid;
  v_purchase_ledger_id uuid;
  v_sales_ledger_id uuid;
BEGIN
  -- Get next voucher number
  v_number := get_next_voucher_number(p_company_id, p_type);

  -- Insert the voucher
  INSERT INTO vouchers (
    company_id, type, number, date, party_ledger_id, account_ledger_id,
    sub_total, gst_total, discount, freight, grand_total, narration, created_by
  ) VALUES (
    p_company_id, p_type, v_number, p_date::date, p_party_ledger_id, p_account_ledger_id,
    p_sub_total, p_gst_total, p_discount, p_freight, p_grand_total, p_narration, auth.uid()
  )
  RETURNING id INTO v_voucher_id;

  -- Insert voucher items (for PURCHASE and SALES)
  IF p_type IN ('PURCHASE', 'SALES') AND p_items IS NOT NULL THEN
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
      INSERT INTO voucher_items (
        voucher_id, stock_item_id, shade, lot, quantity, rate, amount, gst_amount
      ) VALUES (
        v_voucher_id,
        (v_item->>'stock_item_id')::uuid,
        v_item->>'shade',
        v_item->>'lot',
        (v_item->>'quantity')::numeric,
        (v_item->>'rate')::numeric,
        (v_item->>'amount')::numeric,
        COALESCE((v_item->>'gst_amount')::numeric, 0)
      );

      -- Create stock movement
      INSERT INTO stock_movements (
        voucher_id, stock_item_id, godown_id, shade, lot, quantity, movement_type
      ) VALUES (
        v_voucher_id,
        (v_item->>'stock_item_id')::uuid,
        CASE WHEN v_item->>'godown_id' IS NOT NULL
             THEN (v_item->>'godown_id')::uuid
             ELSE NULL
        END,
        v_item->>'shade',
        v_item->>'lot',
        (v_item->>'quantity')::numeric,
        CASE WHEN p_type = 'PURCHASE' THEN 'IN' ELSE 'OUT' END
      );
    END LOOP;
  END IF;

  -- ============================================================
  -- Create journal entries (double-entry accounting)
  -- ============================================================

  IF p_type = 'PURCHASE' THEN
    -- Debit: Purchase Account
    SELECT id INTO v_purchase_ledger_id
      FROM ledgers l
      JOIN ledger_groups lg ON lg.id = l.ledger_group_id
     WHERE lg.company_id = p_company_id AND lg.name = 'Purchase Account'
     LIMIT 1;

    IF v_purchase_ledger_id IS NOT NULL THEN
      INSERT INTO journal_entries (voucher_id, ledger_id, debit, credit)
      VALUES (v_voucher_id, v_purchase_ledger_id, p_sub_total, 0);
    END IF;

    -- Debit GST ledger (if > 0)
    IF p_gst_total > 0 THEN
      SELECT id INTO v_gst_ledger_id
        FROM ledgers l
        JOIN ledger_groups lg ON lg.id = l.ledger_group_id
       WHERE lg.company_id = p_company_id AND lg.name = 'Duties & Taxes'
       LIMIT 1;

      IF v_gst_ledger_id IS NOT NULL THEN
        INSERT INTO journal_entries (voucher_id, ledger_id, debit, credit)
        VALUES (v_voucher_id, v_gst_ledger_id, p_gst_total, 0);
      END IF;
    END IF;

    -- Credit: Party (Sundry Creditor) for grand_total
    INSERT INTO journal_entries (voucher_id, ledger_id, debit, credit)
    VALUES (v_voucher_id, p_party_ledger_id, 0, p_grand_total);

  ELSIF p_type = 'SALES' THEN
    -- Debit: Party (Sundry Debtor) for grand_total
    INSERT INTO journal_entries (voucher_id, ledger_id, debit, credit)
    VALUES (v_voucher_id, p_party_ledger_id, p_grand_total, 0);

    -- Credit: Sales Account
    SELECT id INTO v_sales_ledger_id
      FROM ledgers l
      JOIN ledger_groups lg ON lg.id = l.ledger_group_id
     WHERE lg.company_id = p_company_id AND lg.name = 'Sales Account'
     LIMIT 1;

    IF v_sales_ledger_id IS NOT NULL THEN
      INSERT INTO journal_entries (voucher_id, ledger_id, debit, credit)
      VALUES (v_voucher_id, v_sales_ledger_id, 0, p_sub_total);
    END IF;

    -- Credit GST ledger (if > 0)
    IF p_gst_total > 0 THEN
      SELECT id INTO v_gst_ledger_id
        FROM ledgers l
        JOIN ledger_groups lg ON lg.id = l.ledger_group_id
       WHERE lg.company_id = p_company_id AND lg.name = 'Duties & Taxes'
       LIMIT 1;

      IF v_gst_ledger_id IS NOT NULL THEN
        INSERT INTO journal_entries (voucher_id, ledger_id, debit, credit)
        VALUES (v_voucher_id, v_gst_ledger_id, 0, p_gst_total);
      END IF;
    END IF;

  ELSIF p_type = 'RECEIPT' THEN
    -- Debit: Bank/Cash account
    IF p_account_ledger_id IS NOT NULL THEN
      INSERT INTO journal_entries (voucher_id, ledger_id, debit, credit)
      VALUES (v_voucher_id, p_account_ledger_id, p_grand_total, 0);
    END IF;

    -- Credit: Party ledger
    INSERT INTO journal_entries (voucher_id, ledger_id, debit, credit)
    VALUES (v_voucher_id, p_party_ledger_id, 0, p_grand_total);

  ELSIF p_type = 'PAYMENT' THEN
    -- Debit: Party ledger
    INSERT INTO journal_entries (voucher_id, ledger_id, debit, credit)
    VALUES (v_voucher_id, p_party_ledger_id, p_grand_total, 0);

    -- Credit: Bank/Cash account
    IF p_account_ledger_id IS NOT NULL THEN
      INSERT INTO journal_entries (voucher_id, ledger_id, debit, credit)
      VALUES (v_voucher_id, p_account_ledger_id, 0, p_grand_total);
    END IF;
  END IF;

  RETURN v_voucher_id;
END;
$$;
