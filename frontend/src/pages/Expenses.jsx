import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { getExpenses } from '../lib/api';
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
  const navigate = useNavigate();
  
  const { data, isLoading } = useQuery({
    queryKey: ['expenses', page],
    queryFn: () => getExpenses({ page, per_page: 20 }),
  });

  if (isLoading) return <div className="text-slate-500">Loading...</div>;

  const expenses = data?.data?.data || data?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Expenses</h1>
        <Button onClick={() => navigate('/expenses/new')}>Add Expense</Button>
      </div>

      <div className="rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <Table>
          <TableHeader>
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
                <TableCell colSpan={5} className="h-24 text-center">
                  No expenses found.
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
                    className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    onClick={() => setSelectedExpense(expense)}
                  >
                    <TableCell className="whitespace-nowrap">
                      {format(new Date(expense.expense_date), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="font-medium">{expense.title}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-6 h-6 rounded-full flex items-center justify-center text-white" 
                          style={{ backgroundColor: expense.category?.color || '#ccc' }}
                        >
                          <Icon className="w-3 h-3" />
                        </div>
                        {expense.category?.name || 'Uncategorized'}
                      </div>
                    </TableCell>
                    <TableCell>{expense.payer?.name}</TableCell>
                    <TableCell className="text-right font-bold text-slate-900 dark:text-white">
                      ₹{parseFloat(expense.amount).toFixed(2)}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
      
      <Modal 
        isOpen={!!selectedExpense} 
        onClose={() => setSelectedExpense(null)} 
        title="Expense Details"
      >
        {selectedExpense && (
          <div className="space-y-6">
            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-md space-y-3">
              <div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">{selectedExpense.title}</h3>
                <div className="text-sm text-slate-500">{format(new Date(selectedExpense.expense_date), 'MMMM d, yyyy')}</div>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Total Amount:</span>
                <span className="font-bold text-lg text-slate-900 dark:text-white">₹{parseFloat(selectedExpense.amount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Paid By:</span>
                <span className="font-medium">{selectedExpense.payer?.name}</span>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-3 text-sm uppercase tracking-wider">Split Details</h3>
              <div className="space-y-3">
                {selectedExpense.expense_participants?.map((p, idx) => (
                  <div key={idx} className="flex justify-between items-center text-sm border-b border-slate-100 dark:border-slate-800 pb-2 last:border-0">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: p.member?.color || '#3b82f6' }}>
                        {p.member?.name?.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-slate-700 dark:text-slate-300 font-medium">{p.member?.name}</span>
                    </div>
                    <span className="font-bold text-slate-900 dark:text-white">₹{parseFloat(p.share_amount).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="pt-4 flex justify-end gap-3">
               <Button variant="outline" onClick={() => setSelectedExpense(null)}>Close</Button>
               <Button onClick={() => navigate(`/expenses/${selectedExpense.id}/edit`)}>Edit Expense</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
