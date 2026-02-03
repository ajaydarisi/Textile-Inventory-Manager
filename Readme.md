TEXTILE WHOLESALER INVENTORY & ACCOUNTING SYSTEM
TECHNICAL ARCHITECTURE DOCUMENT
(Next.js + Supabase)

================================================
1. ARCHITECTURE OBJECTIVE
================================================
Design a Tally-like accounting and inventory system using a modern web stack.
The system must ensure accounting correctness, fast voucher entry, strong data
integrity, and simple extensibility.

================================================
2. TECHNOLOGY STACK
================================================

Frontend:
- Framework: Next.js (App Router)
- Language: TypeScript
- UI Components: shadcn/ui
- Styling: Tailwind CSS
- State Management: React Context / local state
- Forms: React Hook Form
- Validation: Zod

Backend:
- Platform: Supabase
- Database: PostgreSQL
- Authentication: Supabase Auth (Email + Password)
- Authorization: Row Level Security (RLS)
- Business Logic: PostgreSQL Functions (RPC)
- API Access: Supabase Client SDK

================================================
3. HIGH-LEVEL ARCHITECTURE
================================================

Next.js Frontend
   |
Supabase Client (Server Actions / API Routes)
   |
Supabase Backend
   - PostgreSQL
   - Auth
   - RLS
   - Functions (RPC)

================================================
4. FRONTEND ARCHITECTURE (NEXT.JS)
================================================

4.1 Next.js Structure (App Router)

app/
 ├─ auth/
 ├─ dashboard/
 ├─ masters/
 │   ├─ company
 │   ├─ ledgers
 │   ├─ stock-items
 │   └─ godown
 ├─ vouchers/
 │   ├─ purchase
 │   ├─ sales
 │   ├─ receipt
 │   └─ payment
 ├─ reports/
 │   ├─ ledger
 │   ├─ outstanding
 │   ├─ trial-balance
 │   ├─ profit-loss
 │   └─ stock
 ├─ layout.tsx
 └─ page.tsx

------------------------------------------------

4.2 UI & Component Rules

- shadcn/ui components for:
  - Forms
  - Dialogs
  - Tables
  - Dropdowns
- Tailwind CSS for layout and spacing
- No heavy animations
- Focus on fast keyboard-driven interaction

------------------------------------------------

4.3 Frontend Responsibilities

- Render forms and reports
- Capture user input
- Perform client-side validation only
- Call Supabase functions or queries
- Display calculated values returned by backend

Frontend MUST NOT:
- Perform debit/credit logic
- Update balances
- Modify stock directly

================================================
5. BACKEND ARCHITECTURE (SUPABASE)
================================================

5.1 Supabase Components Used

- PostgreSQL (Primary data store)
- Supabase Auth (Admin login)
- Row Level Security (Data protection)
- PostgreSQL Functions (Accounting logic)
- Supabase Client SDK (API access)

------------------------------------------------

5.2 Backend Responsibility Split

Supabase handles:
- Data storage
- Authentication
- Authorization
- Accounting logic
- Inventory logic
- Report calculations

Next.js handles:
- UI
- Navigation
- User input
- Rendering reports

================================================
6. ACCOUNTING ENGINE (POSTGRESQL-BASED)
================================================

6.1 Core Accounting Rule
Every voucher creates journal entries.

------------------------------------------------

6.2 Accounting Flow

Voucher Save Request
 -> PostgreSQL Function
 -> Validation (Debit = Credit)
 -> Insert Journal Entries
 -> Commit Transaction
 -> Return Result

------------------------------------------------

6.3 Journal-Based Design

- Journal entries table stores:
  - Voucher reference
  - Ledger ID
  - Debit amount
  - Credit amount
- Ledger balances are derived from journal entries
- Reports read only from journal entries

------------------------------------------------

6.4 Validation Rules

- Total Debit must equal Total Credit
- Voucher save must fail on validation error
- All inserts must be atomic (transaction-based)

================================================
7. INVENTORY ARCHITECTURE
================================================

7.1 Inventory Event Model

- Purchase voucher creates STOCK_IN event
- Sales voucher creates STOCK_OUT event

------------------------------------------------

7.2 Inventory Storage Rules

- Stock stored as movements, not static values
- Each stock movement stores:
  - Stock Item ID
  - Shade
  - Lot
  - Quantity
  - Movement Type (IN / OUT)
  - Voucher reference

------------------------------------------------

7.3 Stock Calculation

Current stock is calculated by:
SUM(STOCK_IN) - SUM(STOCK_OUT)

================================================
8. DATABASE ARCHITECTURE
================================================

8.1 Core Tables

- companies
- users
- ledger_groups
- ledgers
- stock_items
- godowns
- vouchers
- voucher_items
- journal_entries
- stock_movements
- audit_logs

------------------------------------------------

8.2 Transaction Rules

- Voucher creation uses PostgreSQL transactions
- Journal entries and stock movements commit together
- Partial failures are not allowed

================================================
9. AUTHORIZATION & SECURITY
================================================

- Supabase Auth for Admin login
- RLS policies enforce:
  - Company-level isolation
  - User-level access
- Only authenticated users can write data
- All voucher edits/deletes logged in audit_logs

================================================
10. REPORTING ARCHITECTURE
================================================

- Reports are read-only
- Reports are generated using SQL views or RPC functions
- No report modifies data

Report Data Sources:
- journal_entries
- stock_movements

================================================
11. PERFORMANCE CONSIDERATIONS
================================================

- Index on:
  - ledger_id
  - voucher_date
  - stock_item_id
- Use SQL views for heavy reports
- Paginate report data
- Avoid joins in voucher entry paths

================================================
12. DEPLOYMENT SETUP
================================================

Frontend:
- Deployed on Vercel
- Uses environment variables for Supabase keys

Backend:
- Supabase managed infrastructure
- Automated backups enabled

================================================
13. NON-NEGOTIABLE RULES
================================================

- No accounting logic in frontend
- No direct balance updates
- No stock updates outside stock_movements
- No voucher save without journal entries
- Debit must always equal Credit

================================================
END OF TECHNICAL ARCHITECTURE DOCUMENT
================================================
