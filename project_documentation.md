# PG Expense Tracker - Project Documentation

This document serves as a comprehensive manifest of everything that has been built in the project so far, ensuring no steps or functions are forgotten.

---

## 🏗️ Architecture
- **Frontend**: React 18, Vite, TailwindCSS v4, React Router, React Query, React Hook Form, Lucide React (Icons).
- **Backend**: Node.js, Express, Zod (Validation), Supabase JS Client (Service Role).
- **Database**: PostgreSQL (hosted on Supabase) accessed via standard REST bypassing RLS.
- **Deployment Ready**: Configured for Render (Backend) and Vercel (Frontend).

---

## 🗄️ Database Schema (Completed)
- `members`: Stores active and soft-deleted participants. Includes a theme `color`.
- `categories`: Stores expense categories (e.g., Food, Transport) with associated `icon_name` and `color`.
- `expenses`: Core expense records, including total `amount`, `category_id`, and `split_type`.
- `expense_participants`: Join table mapping an `expense` to its `members`. Stores `share_amount` for each participant.
- `settlements`: Tracks completed debt payments between two members.

---

## ⚙️ Backend Services & Functions (Completed)

The backend uses a standard Controller -> Service architecture.

### `membersService.js`
- `getAllMembers()`: Retrieves all non-deleted members.
- `getMemberById(id)`: Retrieves a specific member.
- `createMember(data)`: Inserts a new member.
- `updateMember(id, data)`: Updates member details.
- `softDeleteMember(id)`: Marks a member as deleted instead of dropping them, preserving historical expenses.

### `categoriesService.js`
- `getAllCategories()`: Retrieves all categories sorted by `sort_order`.

### `expensesService.js`
- `getExpenses(limit, offset)`: Paginated fetch of all expenses.
- `getExpenseById(id)`: Fetches a single expense with its participants.
- `createExpense(data)`: **(Transactional Logic)** Inserts an expense, calculates the equal share amount (handling paise remainders), and inserts into `expense_participants`. If participant insertion fails, it automatically rolls back the expense to prevent orphaned data.
- `updateExpense(id, data)`: Updates an expense and reconstructs the participants list.
- `deleteExpense(id)`: Removes an expense.

### `balanceService.js`
- `getDashboardBalances()`: Aggregates total paid vs total owed for every active member across all expenses and subtracts completed settlements to determine `net_balance`.

### `settlementsService.js` & `settlementAlgorithm.js`
- `getSettlements()`: Retrieves the history of completed settlements.
- `createSettlement(data)`: Records a new payment between two users.
- `getSuggestedSettlements()`: Uses `balanceService` to get net balances, then calls `calculateSettlements()`.
- `calculateSettlements(membersWithBalances)`: **(Core Algorithm)** A greedy algorithm that dynamically re-sorts debtors and creditors to find the absolute minimum number of transactions required to settle all debts in the group.

### Other Backend Utilities
- `validate.js`: Express middleware using Zod schemas to ensure type-safety on all incoming requests.
- `errorHandler.js`: Global error catcher that formats Supabase unique constraint errors (e.g., duplicate participants) into clean API responses.
- `swagger.js`: Generates interactive API documentation at `/api-docs`.

---

## 🖥️ Frontend Pages & Components (Completed)

### Reusable UI Components
Built from scratch mirroring the `shadcn/ui` design system:
- `Button.jsx`: Variants for default, outline, ghost.
- `Card.jsx`: Container with Header, Title, and Content slots.
- `Input.jsx` & `Label.jsx`: Form primitives.
- `Table.jsx`: Full table layout for data grids.

### Pages & Routes
- `Dashboard.jsx` (`/`): Displays the total group spending and individual member cards showing if they "Owe" or "Get back" money.
- `Expenses.jsx` (`/expenses`): A tabular view of all historical expenses showing the category icon, date, payer, and amount.
- `ExpenseForm.jsx` (`/expenses/new`): A comprehensive form to add a new expense. Allows selecting the payer, category, and checking off which members are involved in the equal split.
- `Members.jsx` (`/members`): Displays a grid of all members with their generated avatar initials and allows adding new members.
- `Settlements.jsx` (`/settlements`): Shows the algorithm's suggested minimum transactions to settle all debts, with a 1-click "Settle" button. Also displays a history log of past settlements.

---

## 🚀 What Remains (Phase 11)
The core MVP is 100% complete. The final planned features are:
1. **Exact Splits**: Updating `ExpenseForm` and `expensesService` to allow users to input exact amounts for each person instead of forcing an equal division.
2. **CSV Export**: Adding a backend route to generate a CSV string of all expenses, and a download button on the frontend.
3. **PWA Support**: Adding `vite-plugin-pwa` to allow users to install the app on their home screens.
4. **Real-time Sync**: Implementing Socket.io or background polling so that when one user adds an expense, it instantly updates on everyone else's screen.
