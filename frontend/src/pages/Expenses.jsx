import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { getExpenses, getCategories, getMembers } from '../lib/api';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/Table';
import * as Icons from 'lucide-react';

export default function Expenses() {
  const [page, setPage] = useState(1);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const navigate = useNavigate();

  // Filter States
  const [filters, setFilters] = useState({
    search: '',
    category_id: '',
    paid_by: '',
    member_id: '',
    date_preset: '', // 'last_week', 'last_month', 'custom'
    date_from: '',
    date_to: '',
    amount_min: '',
    amount_max: '',
    is_favourite: false
  });

  // Queries
  const { data: categoriesData } = useQuery({ queryKey: ['categories'], queryFn: getCategories });
  const { data: membersData } = useQuery({ queryKey: ['members'], queryFn: getMembers });
  
  const { data, isLoading } = useQuery({
    queryKey: ['expenses', page, filters],
    queryFn: () => {
      // Clean up empty filters before sending to API
      const { date_preset, ...restFilters } = filters;
      const activeFilters = Object.fromEntries(
        Object.entries(restFilters).filter(([_, v]) => v !== '' && v !== false)
      );
      return getExpenses({ page, per_page: 20, ...activeFilters });
    },
  });

  const categories = categoriesData?.data || [];
  const members = membersData?.data || [];
  const expenses = data?.data?.data || data?.data || [];

  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFilters(prev => {
      const newFilters = {
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      };

      // Handle Date Presets logic
      if (name === 'date_preset') {
        const today = new Date();
        if (value === 'last_week') {
          const lastWeek = new Date(today);
          lastWeek.setDate(today.getDate() - 7);
          newFilters.date_from = format(lastWeek, 'yyyy-MM-dd');
          newFilters.date_to = format(today, 'yyyy-MM-dd');
        } else if (value === 'last_month') {
          const lastMonth = new Date(today);
          lastMonth.setMonth(today.getMonth() - 1);
          newFilters.date_from = format(lastMonth, 'yyyy-MM-dd');
          newFilters.date_to = format(today, 'yyyy-MM-dd');
        } else if (value === '' || value === 'custom') {
          newFilters.date_from = '';
          newFilters.date_to = '';
        }
      }

      // If user manually touches date_from or date_to, auto-switch preset to custom
      if (name === 'date_from' || name === 'date_to') {
        newFilters.date_preset = 'custom';
      }

      return newFilters;
    });
    setPage(1); // Reset to page 1 on filter change
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      category_id: '',
      paid_by: '',
      member_id: '',
      date_preset: '',
      date_from: '',
      date_to: '',
      amount_min: '',
      amount_max: '',
      is_favourite: false
    });
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-primary">Expenses</h1>
        <div className="flex gap-3">
          <Button 
            variant={showFilters ? "primary" : "outline"}
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2 shadow-sm"
          >
            <Icons.Filter className="w-4 h-4" />
            Filters
          </Button>
          <Button onClick={() => navigate('/expenses/new')} className="shadow-sm">Add Expense</Button>
        </div>
      </div>

      {/* Mobile Sidebar Backdrop */}
      {showFilters && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 md:hidden animate-in fade-in"
          onClick={() => setShowFilters(false)}
        />
      )}

      {/* Advanced Filters Panel */}
      <div className={`bg-surface z-50 overflow-y-auto flex flex-col shadow-swiss fixed inset-y-0 right-0 w-[85vw] max-w-sm border-l border-divider p-5 transform transition-transform duration-300 ease-in-out md:static md:w-full md:max-w-none md:rounded-[12px] md:border md:transform-none md:transition-none ${showFilters ? "translate-x-0" : "translate-x-full"} ${!showFilters ? "md:hidden" : "md:animate-in md:slide-in-from-top-4 md:fade-in md:duration-200"}`}>
        <div className="flex justify-between items-center mb-4 md:mb-4 pb-4 md:pb-0 border-b md:border-b-0 border-divider">
          <h3 className="font-bold text-primary text-sm uppercase tracking-widest">Advanced Filters</h3>
          <div className="flex items-center gap-4">
            <button onClick={clearFilters} className="text-xs text-muted hover:text-primary underline">Clear All</button>
            <button onClick={() => setShowFilters(false)} className="md:hidden text-muted hover:text-primary">
              <Icons.X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 flex-1 content-start">
          {/* Search */}
          <div className="space-y-1.5 lg:col-span-1">
            <label className="text-xs font-semibold text-muted">Search Title</label>
            <input
              type="text"
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              placeholder="e.g. Dinner"
              className="w-full bg-background border border-divider rounded-[6px] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Category */}
          <div className="space-y-1.5 lg:col-span-1">
            <label className="text-xs font-semibold text-muted">Category</label>
            <select
              name="category_id"
              value={filters.category_id}
              onChange={handleFilterChange}
              className="w-full bg-background border border-divider rounded-[6px] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">All Categories</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Paid By */}
          <div className="space-y-1.5 lg:col-span-1">
            <label className="text-xs font-semibold text-muted">Paid By (Payer)</label>
            <select
              name="paid_by"
              value={filters.paid_by}
              onChange={handleFilterChange}
              className="w-full bg-background border border-divider rounded-[6px] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Anyone</option>
              {members.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>

          {/* Participant */}
          <div className="space-y-1.5 lg:col-span-1">
            <label className="text-xs font-semibold text-muted">Participant</label>
            <select
              name="member_id"
              value={filters.member_id}
              onChange={handleFilterChange}
              className="w-full bg-background border border-divider rounded-[6px] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Anyone</option>
              {members.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>

          {/* Date Preset */}
          <div className="space-y-1.5 lg:col-span-1">
            <label className="text-xs font-semibold text-muted">Date Range</label>
            <select
              name="date_preset"
              value={filters.date_preset}
              onChange={handleFilterChange}
              className="w-full bg-background border border-divider rounded-[6px] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Any Time</option>
              <option value="last_week">Last 7 Days</option>
              <option value="last_month">Last 30 Days</option>
              <option value="custom">Custom Date Range...</option>
            </select>
          </div>

          {/* Custom Date Range (Conditionally Rendered) */}
          {filters.date_preset === 'custom' && (
            <>
              <div className="space-y-1.5 lg:col-span-1 animate-in fade-in">
                <label className="text-xs font-semibold text-muted">Date From</label>
                <input
                  type="date"
                  name="date_from"
                  value={filters.date_from}
                  onChange={handleFilterChange}
                  className="w-full bg-background border border-divider rounded-[6px] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="space-y-1.5 lg:col-span-1 animate-in fade-in">
                <label className="text-xs font-semibold text-muted">Date To</label>
                <input
                  type="date"
                  name="date_to"
                  value={filters.date_to}
                  onChange={handleFilterChange}
                  className="w-full bg-background border border-divider rounded-[6px] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </>
          )}

          {/* Amount Range */}
          <div className={`space-y-1.5 lg:col-span-1 ${filters.date_preset !== 'custom' ? "lg:col-start-3" : ""}`}>
            <label className="text-xs font-semibold text-muted">Min Amount (₹)</label>
            <input
              type="number"
              name="amount_min"
              value={filters.amount_min}
              onChange={handleFilterChange}
              placeholder="0"
              className="w-full bg-background border border-divider rounded-[6px] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="space-y-1.5 lg:col-span-1">
            <label className="text-xs font-semibold text-muted">Max Amount (₹)</label>
            <input
              type="number"
              name="amount_max"
              value={filters.amount_max}
              onChange={handleFilterChange}
              placeholder="10000"
              className="w-full bg-background border border-divider rounded-[6px] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        <div className="mt-6 md:mt-4 pt-4 border-t border-divider flex items-center justify-between pb-4 md:pb-0">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="is_favourite"
              checked={filters.is_favourite}
              onChange={handleFilterChange}
              className="w-4 h-4 rounded text-primary focus:ring-primary"
            />
            <span className="text-sm font-semibold text-primary">Favourites Only <span className="text-amber-500">★</span></span>
          </label>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-[12px] border border-divider bg-surface shadow-swiss overflow-hidden">
        {isLoading ? (
           <div className="h-48 flex items-center justify-center text-slate-500 animate-pulse">Loading expenses...</div>
        ) : (
          <Table>
            <TableHeader className="bg-background/50">
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Paid By</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-muted">
                    No expenses found matching your filters.
                  </TableCell>
                </TableRow>
              ) : (
                expenses.map((expense) => {
                  const Icon = expense.category?.icon_name && Icons[expense.category.icon_name] 
                    ? Icons[expense.category.icon_name] 
                    : Icons.Receipt;

                  return (
                    <TableRow 
                      key={expense.id} 
                      className="cursor-pointer hover:bg-surface-hover transition-colors"
                      onClick={() => setSelectedExpense(expense)}
                    >
                      <TableCell className="whitespace-nowrap font-medium text-muted text-sm">
                        {format(new Date(expense.expense_date), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell className="font-bold text-primary flex items-center gap-2">
                        {expense.title}
                        {expense.is_favourite && <Icons.Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-6 h-6 rounded-[6px] flex items-center justify-center text-white shadow-sm" 
                            style={{ backgroundColor: expense.category?.color || '#ccc' }}
                          >
                            <Icon className="w-3 h-3" />
                          </div>
                          <span className="text-sm font-medium">{expense.category?.name || 'Uncategorized'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-sm">{expense.payer?.name}</TableCell>
                      <TableCell className="text-right font-bold text-primary">
                        ₹{parseFloat(expense.amount).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        )}
      </div>
      
      <Modal 
        isOpen={!!selectedExpense} 
        onClose={() => setSelectedExpense(null)} 
        title="Expense Details"
      >
        {selectedExpense && (
          <div className="space-y-6">
            <div className="bg-background/50 border border-divider p-4 rounded-[8px] space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-xl text-primary flex items-center gap-2">
                    {selectedExpense.title}
                    {selectedExpense.is_favourite && <Icons.Star className="w-5 h-5 fill-amber-400 text-amber-400" />}
                  </h3>
                  <div className="text-sm font-medium text-muted mt-1">{format(new Date(selectedExpense.expense_date), 'MMMM d, yyyy')}</div>
                </div>
                <div 
                  className="px-3 py-1 rounded-[6px] text-xs font-bold text-white shadow-sm"
                  style={{ backgroundColor: selectedExpense.category?.color || '#ccc' }}
                >
                  {selectedExpense.category?.name}
                </div>
              </div>
              <div className="flex justify-between items-center text-sm pt-2 border-t border-divider/50 mt-2">
                <span className="text-muted font-semibold uppercase tracking-wider text-[10px]">Total Amount</span>
                <span className="font-black text-2xl text-primary">₹{parseFloat(selectedExpense.amount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted font-semibold uppercase tracking-wider text-[10px]">Paid By</span>
                <span className="font-bold text-primary">{selectedExpense.payer?.name}</span>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-primary mb-3 text-[11px] uppercase tracking-wider">Split Details</h3>
              <div className="space-y-2">
                {selectedExpense.expense_participants?.map((p, idx) => (
                  <div key={idx} className="flex justify-between items-center text-sm bg-surface p-2.5 rounded-[8px] border border-divider">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-[6px] flex items-center justify-center text-white text-xs font-black shadow-sm" style={{ backgroundColor: p.member?.color || '#3b82f6' }}>
                        {p.member?.name?.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-primary font-bold">{p.member?.name}</span>
                    </div>
                    <span className="font-bold text-primary">₹{parseFloat(p.share_amount).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="pt-4 flex justify-end gap-3 border-t border-divider">
               <Button variant="outline" onClick={() => setSelectedExpense(null)}>Close</Button>
               <Button onClick={() => navigate(`/expenses/${selectedExpense.id}/edit`)}>Edit Expense</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
