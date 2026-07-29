import { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Home, Receipt, Users, Banknote, Activity as ActivityIcon, Calculator, Menu, X } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navItems = [
    { to: '/', label: 'Dashboard', icon: Home },
    { to: '/expenses', label: 'Expenses', icon: Receipt },
    { to: '/activity', label: 'Activity', icon: ActivityIcon },
    { to: '/members', label: 'Members', icon: Users },
    { to: '/settlements', label: 'Settlements', icon: Banknote },
    { to: '/breakdown', label: 'Debt Breakdown', icon: Calculator },
  ];

  return (
    <div className="flex h-screen bg-background flex-col md:flex-row overflow-hidden">
      {/* Mobile Header */}
      <div className="md:hidden h-16 bg-surface border-b border-divider flex items-center gap-3 px-4 shrink-0">
        <button 
          onClick={() => setIsSidebarOpen(true)} 
          className="p-2 text-primary hover:bg-surface-hover rounded-md transition-colors -ml-2"
        >
          <Menu className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold text-primary tracking-tight">PG Expense</h1>
      </div>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm transition-opacity" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-surface border-r border-divider flex flex-col transform transition-transform duration-200 ease-in-out md:static md:translate-x-0",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="h-16 flex items-center justify-between px-6 border-b border-divider shrink-0">
          <h1 className="text-xl font-bold text-primary tracking-tight">PG Expense</h1>
          <button 
            onClick={() => setIsSidebarOpen(false)} 
            className="md:hidden p-2 text-primary hover:bg-surface-hover rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setIsSidebarOpen(false)}
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
        <div className="max-w-5xl mx-auto p-4 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
