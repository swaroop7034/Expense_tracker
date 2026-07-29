import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Expenses from './pages/Expenses';
import ExpenseForm from './pages/ExpenseForm';
import Members from './pages/Members';
import Settlements from './pages/Settlements';
import Activity from './pages/Activity';
import SimplificationBreakdown from './pages/SimplificationBreakdown';
import Analytics from './pages/Analytics';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="expenses" element={<Expenses />} />
          <Route path="expenses/new" element={<ExpenseForm />} />
          <Route path="expenses/:id/edit" element={<ExpenseForm />} />
          <Route path="members" element={<Members />} />
          <Route path="settlements" element={<Settlements />} />
          <Route path="activity" element={<Activity />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="breakdown" element={<SimplificationBreakdown />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
