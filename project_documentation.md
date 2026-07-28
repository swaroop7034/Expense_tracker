# PG Expense Tracker - Comprehensive Documentation

Welcome to the comprehensive documentation for the **PG Expense Tracker**. This document outlines the architecture, database schema, backend services, frontend structure, and every feature implemented up until this point.

---

## 🏗️ Architecture Stack
- **Frontend**: React 18, Vite, TailwindCSS v4, React Router, React Query, React Hook Form, Lucide React (Icons).
- **Backend**: Node.js, Express, Zod (Validation), Supabase JS Client (Service Role).
- **Database**: PostgreSQL (hosted on Supabase) accessed via standard REST bypassing RLS.
- **Deployment Ready**: Configured for Render (Backend) and Vercel (Frontend).

---

## 🗄️ Database Schema
- `members`: Stores active and soft-deleted participants. Includes a theme `color`.
- `categories`: Stores expense categories (e.g., Food, Transport) with associated `icon_name` and `color`.
- `expenses`: Core expense records, including total `amount`, `category_id`, and `split_type` (equal, exact).
- `expense_participants`: Join table mapping an `expense` to its `members`. Stores the exact `share_amount` for each participant.
- `settlements`: Tracks completed debt payments between two members.

---

## ⚙️ Backend Services & Functions

The backend follows a modular Controller -> Service architecture, utilizing Zod for strict request validation.

### `membersService.js`
- `getAllMembers()`: Retrieves all non-deleted members.
- `getMemberById(id)`: Retrieves a specific member.
- `getMemberDetails(id)`: **[NEW]** Aggregates a member's total paid, total owed, net balance, and their entire settlement history in one comprehensive payload.
- `createMember(data)`: Inserts a new member.
- `updateMember(id, data)`: Updates member details.
- `softDeleteMember(id)`: Marks a member as deleted instead of dropping them, preserving historical expenses.

### `categoriesService.js`
- `getAllCategories()`: Retrieves all categories sorted by `sort_order`.

### `expensesService.js`
- `getExpenses(query)`: Paginated, filterable, and sortable fetch of expenses.
- `getExpenseById(id)`: Fetches a single expense with its participants.
- `createExpense(data)`: **(Transactional Logic)** Inserts an expense. Supports both `equal` and `exact` split types. Ensures the "Paid By" person is only included if explicitly selected. If participant insertion fails, it automatically rolls back the expense to prevent orphaned data.
- `updateExpense(id, data)`: Updates an expense and perfectly reconstructs the participants list based on the new split type.
- `deleteExpense(id)`: Soft removes an expense.

### `balanceService.js`
- `calculateBalances()`: Aggregates total paid vs total owed for every active member across all expenses and subtracts completed settlements to determine a final `net_balance`.

### `settlementsService.js` & `settlementAlgorithm.js`
- `getSettlements()`: Retrieves the history of completed settlements.
- `createSettlement(data)`: Records a new payment between two users.
- `getSuggestedSettlements()`: Uses `balanceService` to get net balances, then calls the optimization algorithm.
- `calculateSettlements(membersWithBalances)`: **(Core Algorithm)** A greedy Cash-Flow Minimization algorithm that dynamically re-sorts debtors and creditors to find the absolute minimum number of transactions required to settle all debts in the group.

### `breakdownService.js` **[NEW]**
- `getSimplificationBreakdown()`: Generates a 3-step debt analysis:
  1. **Raw Debts**: Calculates who owes who based strictly on raw expense participation (Participant -> Payer).
  2. **Net Balances**: Shows the absolute balance of each user (Positive = owed, Negative = owes).
  3. **Simplified Debts**: Displays the final output of the cash-flow minimization algorithm.

### `activityService.js` **[NEW]**
- `getActivityFeed()`: Combines both `expenses` and `settlements` into a unified, chronologically sorted timeline of events.

---

## 🖥️ Frontend Pages & Features

### Core UI Components
Built from scratch mirroring the `shadcn/ui` design aesthetic:
- `Button.jsx`, `Card.jsx`, `Input.jsx`, `Label.jsx`, `Modal.jsx`, `Table.jsx`.

### Key Pages
- **Dashboard (`/`)**: Displays the total group spending and individual member cards showing if they "Owe" or "Get back" money.
- **Activity (`/activity`)**: **[NEW]** A unified chronological timeline showing all expenses added and settlements made, grouped by date (Today, Yesterday, etc.) sorted newest to oldest.
- **Expenses (`/expenses`)**: A tabular view of all historical expenses showing the category icon, date, payer, and amount.
- **Expense Form (`/expenses/new`)**: 
  - Allows selecting payer and category.
  - **[NEW] Exact Split Feature**: Includes a toggle to switch between "Split Equally" and "Split Exactly". 
  - **[NEW] Live Validation**: When splitting exactly, users enter custom amounts. The form validates in real-time that the entered amounts perfectly sum up to the total expense amount.
- **Members (`/members`)**: Displays a grid of all members. 
  - **[NEW] Member Details Modal**: Clicking a member card opens a detailed view showing their total stats and a history log of all settlements they've been involved in.
- **Settlements (`/settlements`)**: Shows the algorithm's suggested minimum transactions to settle all debts, with a 1-click "Settle" button. Also displays a history log of past settlements.
- **Debt Breakdown (`/breakdown`)**: **[NEW]** A deeply educational page that shows exactly how the Cash-Flow Minimization algorithm works. It displays the Raw Debts, the Net Balances, and the final Simplified Debts in clear, visual lists.

---

## 🚀 Planned Future Enhancements
The core application and advanced financial algorithms are fully operational. Remaining future enhancements include:

1. **AI Chatbot (Planned)**: An integration with Google Gemini inside the Debt Breakdown page to explain complex debt structures in conversational English (See `future_enhancements_ai_chatbot.md`).
2. **CSV Export**: Adding a feature to download all expenses and settlements as a `.csv` spreadsheet.
3. **PWA Support**: Adding `vite-plugin-pwa` so users can install the application directly on their mobile home screens.
4. **Real-time Sync**: Implementing WebSockets (Socket.io) or polling to sync data instantly across multiple clients when someone adds an expense.
