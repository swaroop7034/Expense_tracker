import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { getCategories, getMembers, createExpense, updateExpense, getExpenseById } from '../lib/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Card, CardHeader, CardContent } from '../components/ui/Card';

export default function ExpenseForm() {
  const { id } = useParams();
  const isEditing = !!id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      title: '',
      amount: '',
      category_id: '',
      paid_by: '',
      expense_date: new Date().toISOString().split('T')[0],
      participants: [],
      notes: ''
    }
  });

  const { data: categoriesData } = useQuery({ queryKey: ['categories'], queryFn: getCategories });
  const { data: membersData } = useQuery({ queryKey: ['members'], queryFn: getMembers });
  
  const { data: expenseData, isLoading: isLoadingExpense } = useQuery({
    queryKey: ['expense', id],
    queryFn: () => getExpenseById(id),
    enabled: isEditing
  });

  const categories = categoriesData?.data || [];
  const members = membersData?.data || [];

  useEffect(() => {
    if (isEditing && expenseData?.data) {
      const exp = expenseData.data;
      reset({
        title: exp.title,
        amount: exp.amount,
        category_id: exp.category_id,
        paid_by: exp.paid_by,
        expense_date: exp.expense_date.split('T')[0],
        participants: exp.expense_participants.map(p => p.member_id),
        notes: exp.notes || ''
      });
    }
  }, [isEditing, expenseData, reset]);

  const mutation = useMutation({
    mutationFn: isEditing ? updateExpense : createExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expense', id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      navigate('/expenses');
    },
  });

  const onSubmit = (data) => {
    const payload = {
      ...data,
      amount: parseFloat(data.amount),
      participants: Array.isArray(data.participants) 
        ? data.participants 
        : (data.participants ? [data.participants] : [])
    };
    if (isEditing) {
      mutation.mutate({ id, data: payload });
    } else {
      mutation.mutate(payload);
    }
  };

  if (isEditing && isLoadingExpense) {
    return <div className="text-slate-500">Loading expense details...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          {isEditing ? 'Edit Expense' : 'Add Expense'}
        </h1>
        <Button variant="outline" onClick={() => navigate('/expenses')}>Cancel</Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" {...register('title', { required: 'Title is required' })} />
              {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (₹)</Label>
                <Input type="number" step="0.01" id="amount" {...register('amount', { required: 'Amount is required', min: 0.01 })} />
                {errors.amount && <p className="text-sm text-red-500">{errors.amount.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="expense_date">Date</Label>
                <Input type="date" id="expense_date" {...register('expense_date', { required: 'Date is required' })} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category_id">Category</Label>
              <select 
                id="category_id"
                className="flex h-10 w-full rounded-md border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
                {...register('category_id', { required: 'Category is required' })}
              >
                <option value="">Select a category</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="paid_by">Paid By</Label>
              <select 
                id="paid_by"
                className="flex h-10 w-full rounded-md border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
                {...register('paid_by', { required: 'Paid By is required' })}
              >
                <option value="">Select who paid</option>
                {members.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Participants (Split Equally)</Label>
              <div className="grid grid-cols-2 gap-2 mt-2 border rounded-md p-4 dark:border-slate-700">
                {members.map(m => (
                  <label key={m.id} className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      value={m.id} 
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      {...register('participants', { required: 'Select at least one participant' })}
                    />
                    <span className="text-sm">{m.name}</span>
                  </label>
                ))}
              </div>
              {errors.participants && <p className="text-sm text-red-500">{errors.participants.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Input id="notes" {...register('notes')} />
            </div>

            <div className="pt-4">
              <Button type="submit" className="w-full" disabled={mutation.isPending}>
                {mutation.isPending ? 'Saving...' : (isEditing ? 'Update Expense' : 'Save Expense')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
