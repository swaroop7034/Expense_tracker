import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
import { getMembers, createMember, getMemberDetails } from '../lib/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { cn } from '../components/ui/Button';

function MemberDetailsModal({ memberId, onClose }) {
  const { data, isLoading } = useQuery({
    queryKey: ['memberDetails', memberId],
    queryFn: () => getMemberDetails(memberId),
    enabled: !!memberId,
  });

  if (isLoading) return <div className="p-4 text-slate-500">Loading details...</div>;
  if (!data?.data) return null;

  const { member, netBalance, owes, owedBy, recentSettlements } = data.data;

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex items-center gap-4 bg-background/50 border border-divider p-4 rounded-[8px]">
        <div className="w-16 h-16 rounded-[8px] flex items-center justify-center text-white font-bold text-2xl" style={{ backgroundColor: member.color || '#3b82f6' }}>
          {member.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <h2 className="text-xl font-bold text-primary">{member.name}</h2>
          <div className="text-sm mt-1 font-medium text-muted">
            Net Balance: {' '}
            <span className={netBalance > 0 ? 'text-emerald-500' : netBalance < 0 ? 'text-red-500' : 'text-muted'}>
              {netBalance > 0 ? '+' : ''}{netBalance.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Debts Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Owes */}
        <div className="space-y-2">
          <h3 className="font-semibold text-sm text-muted uppercase tracking-wider">Owes To</h3>
          <div className="space-y-2">
            {owes.length === 0 ? <p className="text-sm text-muted">Nothing owed.</p> : owes.map((debt, i) => (
              <div key={i} className="flex justify-between items-center text-sm p-2 rounded-[8px] bg-red-900/20 text-red-500 border border-red-500/10">
                <span>{debt.to.name}</span>
                <span className="font-bold">₹{debt.amount.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Owed By */}
        <div className="space-y-2">
          <h3 className="font-semibold text-sm text-muted uppercase tracking-wider">Gets Back From</h3>
          <div className="space-y-2">
            {owedBy.length === 0 ? <p className="text-sm text-muted">Nobody owes them.</p> : owedBy.map((debt, i) => (
              <div key={i} className="flex justify-between items-center text-sm p-2 rounded-[8px] bg-emerald-900/20 text-emerald-500 border border-emerald-500/10">
                <span>{debt.from.name}</span>
                <span className="font-bold">₹{debt.amount.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Settlements */}
      <div className="space-y-2">
        <h3 className="font-semibold text-sm text-muted uppercase tracking-wider">Recent Settlements</h3>
        <div className="space-y-2">
          {recentSettlements.length === 0 ? <p className="text-sm text-muted">No recent settlements.</p> : recentSettlements.map(s => {
            const isPayer = s.from_member.id === memberId;
            return (
              <div key={s.id} className="flex justify-between items-center text-sm p-3 border border-divider rounded-[8px] bg-background/50">
                <div className="flex flex-col">
                  <span className="font-medium text-primary">
                    {isPayer ? `Paid ${s.to_member.name}` : `Received from ${s.from_member.name}`}
                  </span>
                  <span className="text-xs text-muted">{format(new Date(s.settled_date || s.created_at), 'MMM d, yyyy')}</span>
                </div>
                <div className={cn("font-bold flex items-center gap-1", isPayer ? "text-emerald-500" : "text-primary")}>
                  {isPayer ? <ArrowRight className="w-3 h-3" /> : <ArrowLeft className="w-3 h-3" />}
                  ₹{parseFloat(s.amount).toFixed(2)}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  );
}

export default function Members() {
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState(null);
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: { name: '', email: '', color: '#3b82f6' }
  });

  const { data, isLoading } = useQuery({ queryKey: ['members'], queryFn: getMembers });

  const mutation = useMutation({
    mutationFn: createMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      reset();
      setShowAddForm(false);
    }
  });

  if (isLoading) return <div>Loading...</div>;

  const members = data?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-primary">Members</h1>
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? 'Cancel' : 'Add Member'}
        </Button>
      </div>

      {showAddForm && (
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" {...register('name', { required: 'Name is required' })} />
                  {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email (Optional)</Label>
                  <Input type="email" id="email" {...register('email')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="color">Theme Color</Label>
                  <div className="flex gap-2">
                    <Input type="color" id="color" className="w-16 p-1 h-10" {...register('color', { required: 'Color is required' })} />
                    <Input type="text" value={register('color').value} {...register('color')} className="flex-1" />
                  </div>
                </div>
              </div>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? 'Saving...' : 'Save Member'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {members.map(member => (
          <Card 
            key={member.id} 
            className="cursor-pointer hover:ring-2 hover:ring-divider transition-all"
            onClick={() => setSelectedMemberId(member.id)}
          >
            <CardHeader className="flex flex-row items-center gap-4">
              {member.avatar_url ? (
                <img src={member.avatar_url} alt={member.name} className="w-16 h-16 rounded-[8px] object-cover" />
              ) : (
                <div className="w-16 h-16 rounded-[8px] flex items-center justify-center text-white font-bold text-2xl shadow-sm" style={{ backgroundColor: member.color || '#3b82f6' }}>
                  {member.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <CardTitle className="text-primary">{member.name}</CardTitle>
                {member.email && <div className="text-sm text-muted mt-1">{member.email}</div>}
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Modal
        isOpen={!!selectedMemberId}
        onClose={() => setSelectedMemberId(null)}
        title="Member Details"
      >
        {selectedMemberId && (
          <MemberDetailsModal 
            memberId={selectedMemberId} 
            onClose={() => setSelectedMemberId(null)} 
          />
        )}
      </Modal>
    </div>
  );
}
