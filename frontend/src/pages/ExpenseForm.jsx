import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { getCategories, getMembers, createExpense, updateExpense, getExpenseById, deleteExpense } from '../lib/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Card, CardHeader, CardContent } from '../components/ui/Card';

export default function ExpenseForm() {
  const { id } = useParams();
  const isEditing = !!id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [splitType, setSplitType] = useState('equal');
  
  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      title: '',
      amount: '',
      category_id: '',
      paid_by: '',
      expense_date: new Date().toISOString().split('T')[0],
      participants: [], // array of member_ids
      exact_amounts: {}, // member_id -> amount
      notes: ''
    }
  });

  const totalAmount = watch('amount');
  const selectedParticipants = watch('participants') || [];
  const exactAmounts = watch('exact_amounts') || {};

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
      setSplitType(exp.split_type);
      
      const exactMap = {};
      if (exp.split_type === 'exact') {
        exp.expense_participants.forEach(p => {
          exactMap[p.member_id] = parseFloat(p.share_amount);
        });
      }

      reset({
        title: exp.title,
        amount: exp.amount,
        category_id: exp.category_id,
        paid_by: exp.paid_by,
        expense_date: exp.expense_date.split('T')[0],
        participants: exp.expense_participants.map(p => p.member_id),
        exact_amounts: exactMap,
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
      queryClient.invalidateQueries({ queryKey: ['activity'] });
      navigate('/expenses');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteExpense(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['activity'] });
      navigate('/expenses');
    }
  });

  const onSubmit = (data) => {
    let participantsData = [];
    const amountFloat = parseFloat(data.amount);

    // Filter out participants if they are a single string from react-hook-form checkbox behavior
    const pArray = Array.isArray(data.participants) ? data.participants : (data.participants ? [data.participants] : []);

    if (splitType === 'equal') {
      participantsData = pArray;
    } else if (splitType === 'exact') {
      let sum = 0;
      participantsData = pArray.map(pid => {
        const amt = parseFloat(data.exact_amounts[pid]) || 0;
        sum += amt;
        return { member_id: pid, amount: amt };
      }).filter(p => p.amount > 0);

      if (Math.abs(sum - amountFloat) > 0.01) {
        alert(`The exact amounts (₹${sum.toFixed(2)}) must sum up to the total amount (₹${amountFloat.toFixed(2)})`);
        return;
      }
      
      if (participantsData.length === 0) {
        alert("Please enter exact amounts for participants.");
        return;
      }
    }

    const payload = {
      ...data,
      split_type: splitType,
      amount: amountFloat,
      participants: participantsData
    };
    
    // Cleanup unnecessary fields
    delete payload.exact_amounts;

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
        <h1 className="text-2xl font-bold text-primary">
          {isEditing ? 'Edit Expense' : 'Add Expense'}
        </h1>
        <Button variant="outline" onClick={() => navigate('/expenses')}>Cancel</Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" {...register('title', { required: 'Title is required' })} />
              {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Total Amount (₹)</Label>
                <Input type="number" step="0.01" id="amount" {...register('amount', { required: 'Amount is required', min: 0.01 })} />
                {errors.amount && <p className="text-sm text-red-500">{errors.amount.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="expense_date">Date</Label>
                <Input type="date" id="expense_date" {...register('expense_date', { required: 'Date is required' })} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category_id">Category</Label>
                <select 
                  id="category_id"
                  className="flex h-10 w-full rounded-[8px] border border-divider bg-surface text-primary px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
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
                  className="flex h-10 w-full rounded-[8px] border border-divider bg-surface text-primary px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  {...register('paid_by', { required: 'Paid By is required' })}
                >
                  <option value="">Select who paid</option>
                  {members.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Participants</Label>
                <div className="flex items-center space-x-2 bg-surface-hover p-1 rounded-[8px]">
                  <button
                    type="button"
                    onClick={() => setSplitType('equal')}
                    className={`px-3 py-1 text-sm rounded-[8px] transition-colors ${splitType === 'equal' ? 'bg-surface shadow-swiss text-primary font-medium' : 'text-muted hover:text-primary'}`}
                  >
                    Split Equally
                  </button>
                  <button
                    type="button"
                    onClick={() => setSplitType('exact')}
                    className={`px-3 py-1 text-sm rounded-[8px] transition-colors ${splitType === 'exact' ? 'bg-surface shadow-swiss text-primary font-medium' : 'text-muted hover:text-primary'}`}
                  >
                    Split Exactly
                  </button>
                </div>
              </div>

              <div className={`grid gap-2 border border-divider rounded-[8px] p-4 ${splitType === 'equal' ? 'grid-cols-2' : 'grid-cols-1'}`}>
                {members.map(m => {
                  const isChecked = Array.isArray(selectedParticipants) 
                    ? selectedParticipants.includes(m.id) 
                    : selectedParticipants === m.id;

                  return (
                    <div key={m.id} className="flex items-center justify-between space-x-2">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input 
                          type="checkbox" 
                          value={m.id} 
                          className="rounded-[4px] border-divider text-primary focus:ring-primary bg-background"
                          {...register('participants', { required: splitType === 'equal' ? 'Select at least one participant' : false })}
                        />
                        <span className="text-sm font-medium text-primary">{m.name}</span>
                      </label>
                      
                      {splitType === 'exact' && (
                        <div className="flex items-center">
                          <span className="text-muted text-sm mr-2">₹</span>
                          <Input 
                            type="number" 
                            step="0.01" 
                            disabled={!isChecked}
                            className={`w-24 h-8 text-right ${!isChecked ? 'opacity-50' : ''}`}
                            placeholder="0.00"
                            {...register(`exact_amounts.${m.id}`)}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {errors.participants && splitType === 'equal' && <p className="text-sm text-red-500">{errors.participants.message}</p>}
              
              {splitType === 'exact' && (
                <div className="flex justify-between items-center text-sm px-1">
                  <span className="text-muted">
                    Sum: ₹{members.reduce((acc, m) => acc + (parseFloat(exactAmounts[m.id]) || 0), 0).toFixed(2)}
                  </span>
                  <span className={Math.abs(members.reduce((acc, m) => acc + (parseFloat(exactAmounts[m.id]) || 0), 0) - (parseFloat(totalAmount) || 0)) > 0.01 ? "text-red-500 font-medium" : "text-emerald-500 font-medium"}>
                    Target: ₹{(parseFloat(totalAmount) || 0).toFixed(2)}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Input id="notes" {...register('notes')} />
            </div>

            <div className="pt-4 flex gap-4">
              <Button type="submit" className="flex-1" disabled={mutation.isPending || deleteMutation.isPending}>
                {mutation.isPending ? 'Saving...' : (isEditing ? 'Update Expense' : 'Save Expense')}
              </Button>
              {isEditing && (
                <Button 
                  type="button" 
                  variant="outline" 
                  className="text-red-500 hover:text-white hover:bg-red-500 border-red-500/50"
                  disabled={deleteMutation.isPending || mutation.isPending}
                  onClick={() => {
                    if (window.confirm('Are you sure you want to delete this expense?')) {
                      deleteMutation.mutate();
                    }
                  }}
                >
                  {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
