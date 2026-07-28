import { Outlet, NavLink } from 'react-router-dom';
import { Home, Receipt, Users, Banknote, Activity as ActivityIcon, Calculator } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default function Layout() {
  const navItems = [
    { to: '/', label: 'Dashboard', icon: Home },
    { to: '/expenses', label: 'Expenses', icon: Receipt },
    { to: '/activity', label: 'Activity', icon: ActivityIcon },
    { to: '/members', label: 'Members', icon: Users },
    { to: '/settlements', label: 'Settlements', icon: Banknote },
    { to: '/breakdown', label: 'Debt Breakdown', icon: Calculator },
  ];

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 bg-surface border-r border-divider flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-divider">
          <h1 className="text-xl font-bold text-primary tracking-tight">PG Expense</h1>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2 rounded-[8px] transition-colors",
                  isActive
                    ? 'bg-surface-hover text-primary shadow-sm'
                    : 'text-muted hover:bg-surface-hover hover:text-primary'
                )
              }
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
