# PG Expense Tracker 💰

A full-stack, institutional-grade expense tracking application designed for flatmates, friend groups, and travelers to seamlessly log shared expenses and automatically calculate the mathematically optimal way to settle debts.

Designed with a sleek "Swiss Fintech" aesthetic featuring warm pastel creams and high-contrast typography.

## 🚀 Features

- **Intuitive Dashboard**: At-a-glance view of who owes what, and who needs to be paid back.
- **Smart Debt Simplification**: A greedy algorithm recalculates all group debts into the absolute minimum number of transactions required to settle up. 
- **Flexible Splitting**: Split bills equally amongst selected members, or enter exact amounts for complex receipts.
- **Activity Feed**: A chronological ledger of all expenses, settlements, and updates.
- **Detailed Breakdowns**: See the exact math behind who owes whom in the simplification breakdown.
- **Member Management**: Add flatmates with custom colors and avatars.

## 🛠️ Technology Stack

**Frontend**
- React 18 (Vite)
- TailwindCSS v4
- React Router DOM
- React Query (TanStack)
- React Hook Form
- Lucide React (Icons)

**Backend**
- Node.js & Express
- Supabase (PostgreSQL Database)
- Zod (Type validation)
- Swagger (API Documentation)

## 📦 Local Development Setup

### Prerequisites
- Node.js (v18+)
- A [Supabase](https://supabase.com/) project (Free Tier is perfect)

### 1. Database Setup
1. Create a new Supabase project.
2. Go to the SQL Editor in your Supabase dashboard.
3. Copy the contents of `database/schema.sql` and run it to provision your tables.

### 2. Backend Setup
```bash
cd backend
npm install
```
Create a `.env` file in the `backend` directory:
```env
PORT=10000
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```
Start the backend server:
```bash
npm run dev
```
*(API Documentation will be available at `http://localhost:10000/api-docs`)*

### 3. Frontend Setup
```bash
cd frontend
npm install
```
Create a `.env` file in the `frontend` directory:
```env
VITE_API_URL=http://localhost:10000/api/v1
```
Start the frontend development server:
```bash
npm run dev
```

## 🌍 Deployment
- **Backend**: Ready to be deployed on [Render](https://render.com) using the included `render.yaml` configuration.
- **Frontend**: Optimized for zero-config deployment on [Vercel](https://vercel.com) or [Netlify](https://netlify.com).

## 📝 License
MIT License
