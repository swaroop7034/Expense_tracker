import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getDashboard, getSuggestedSettlements } from '../lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { cn } from '../components/ui/Button';

export default function Dashboard() {
  const navigate = useNavigate();

  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboard
  });

  const { data: settlementsData } = useQuery({
    queryKey: ['suggestedSettlements'],
    queryFn: getSuggestedSettlements
  });

  if (isLoading) return <div className="text-slate-500">Loading dashboard...</div>;
  if (error) return <div className="text-red-500">Error loading dashboard</div>;

  const balances = dashboardData?.data?.balances || [];
  const suggested = settlementsData?.data || [];
  
  // Total group spending is sum of all paid amounts
  const totalSpending = balances.reduce((sum, b) => sum + b.paid, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
        <Button onClick={() => navigate('/expenses/new')}>Add Expense</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total Group Spending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900 dark:text-white">
              ₹{totalSpending.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-8 mb-4">Member Balances</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {balances.map((member) => {
          const owesList = suggested.filter(s => s.from === member.member_id);
          const receivesList = suggested.filter(s => s.to === member.member_id);

          return (
            <Card key={member.member_id} className="overflow-hidden">
              <div className="h-2 w-full" style={{ backgroundColor: member.color || '#3b82f6' }} />
              <CardHeader className="pb-2 flex flex-row items-center gap-4 border-b border-slate-100 dark:border-slate-800">
                {member.avatar_url ? (
                  <img src={member.avatar_url} alt={member.name} className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0" style={{ backgroundColor: member.color || '#3b82f6' }}>
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <CardTitle className="truncate">{member.name}</CardTitle>
                  <div className={cn(
                    "text-sm font-medium mt-1 truncate",
                    member.net_balance > 0 ? "text-emerald-600 dark:text-emerald-400" :
                    member.net_balance < 0 ? "text-rose-600 dark:text-rose-400" :
                    "text-slate-500"
                  )}>
                    {member.net_balance > 0 ? `Gets back ₹${member.net_balance.toFixed(2)}` :
                     member.net_balance < 0 ? `Owes ₹${Math.abs(member.net_balance).toFixed(2)}` :
                     "Settled up"}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4 bg-slate-50/50 dark:bg-slate-900/50">
                <div className="space-y-4">
                  {/* Owes To Section */}
                  {owesList.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-rose-500 uppercase tracking-wider mb-2">Owes To</h4>
                      <div className="space-y-2">
                        {owesList.map((s, idx) => (
                          <div key={idx} className="flex justify-between items-center text-sm">
                            <span className="text-slate-600 dark:text-slate-400 truncate">{s.to_name}</span>
                            <span className="font-medium text-slate-900 dark:text-white ml-2 whitespace-nowrap">₹{s.amount.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Gets Back From Section */}
                  {receivesList.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-emerald-500 uppercase tracking-wider mb-2">Gets Back From</h4>
                      <div className="space-y-2">
                        {receivesList.map((s, idx) => (
                          <div key={idx} className="flex justify-between items-center text-sm">
                            <span className="text-slate-600 dark:text-slate-400 truncate">{s.from_name}</span>
                            <span className="font-medium text-slate-900 dark:text-white ml-2 whitespace-nowrap">₹{s.amount.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Settled up state */}
                  {owesList.length === 0 && receivesList.length === 0 && (
                    <div className="text-center py-2 text-sm text-slate-500 italic">
                      Fully settled up! 🎉
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
