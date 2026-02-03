export type LedgerGroupNature = "Asset" | "Liability" | "Income" | "Expense";

export type LedgerGroupName =
  | "Sundry Debtors"
  | "Sundry Creditors"
  | "Sales Account"
  | "Purchase Account"
  | "Cash"
  | "Bank"
  | "Duties & Taxes"
  | "Direct Expenses"
  | "Capital Account";

export interface Company {
  id: string;
  name: string;
  financial_year: string;
  gstin: string | null;
  state: string | null;
  created_at: string;
}

export interface LedgerGroup {
  id: string;
  company_id: string;
  name: string;
  parent_id: string | null;
  nature: LedgerGroupNature;
  is_system: boolean;
}

export interface Ledger {
  id: string;
  company_id: string;
  name: string;
  ledger_group_id: string;
  gstin?: string | null;
  opening_balance: number;
  created_at: string;
  // Joined fields
  ledger_group?: LedgerGroup;
}

export interface Godown {
  id: string;
  company_id: string;
  name: string;
  created_at: string;
}

export interface StockItem {
  id: string;
  company_id: string;
  name: string;
  article_no: string;
  category: string;
  unit: string;
  gst_rate: number;
  created_at: string;
}

export type VoucherType = "PURCHASE" | "SALES" | "RECEIPT" | "PAYMENT";

export interface VoucherItem {
  id: string;
  voucher_id: string;
  stock_item_id: string;
  shade: string;
  lot: string;
  quantity: number;
  rate: number;
  amount: number;
  gst_amount: number;
  // Joined fields
  stock_item?: StockItem;
}

export interface Voucher {
  id: string;
  company_id: string;
  type: VoucherType;
  number: number;
  date: string;
  party_ledger_id: string;
  account_ledger_id: string | null;
  sub_total: number;
  gst_total: number;
  discount: number;
  freight: number;
  grand_total: number;
  narration: string | null;
  created_by: string | null;
  created_at: string;
  // Joined fields
  party_ledger?: Ledger;
  voucher_items?: VoucherItem[];
}

export interface JournalEntry {
  id: string;
  voucher_id: string;
  ledger_id: string;
  debit: number;
  credit: number;
  // Joined fields
  ledger?: Ledger;
  voucher?: Voucher;
}

export type MovementType = "IN" | "OUT";

export interface StockMovement {
  id: string;
  voucher_id: string;
  stock_item_id: string;
  godown_id: string | null;
  shade: string;
  lot: string;
  quantity: number;
  movement_type: MovementType;
  created_at: string;
}

export type AuditAction = "INSERT" | "UPDATE" | "DELETE";

export interface AuditLog {
  id: string;
  company_id: string;
  table_name: string;
  record_id: string;
  action: AuditAction;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  user_id: string | null;
  created_at: string;
}

export interface StockSummaryRow {
  stock_item_id: string;
  item_name: string;
  category: string;
  unit: string;
  current_qty: number;
}
