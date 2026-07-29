import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getDashboard, getSuggestedSettlements } from '../lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { cn } from '../components/ui/Button';
import { 
  Wallet, 
  CalendarDays, 
  TrendingUp, 
  ArrowUpRight, 
  Trophy, 
  PieChart, 
  Zap,
  HandCoins
} from 'lucide-react';

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

  if (isLoading) return <div className="text-slate-500 animate-pulse">Loading dashboard...</div>;
  if (error) return <div className="text-red-500">Error loading dashboard</div>;

  const balances = dashboardData?.data?.balances || [];
  const analytics = dashboardData?.data?.analytics || {};
  const suggested = settlementsData?.data || [];
  
  // Pending settlements
  const pendingSettlements = suggested.reduce((sum, s) => sum + s.amount, 0);

  // Cards Data Array
  const statCards = [
    {
      title: "Total Expenses",
      value: `₹${parseFloat(analytics.total_expenses || 0).toFixed(2)}`,
      icon: Wallet,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10"
    },
    {
      title: "This Month",
      value: `₹${parseFloat(analytics.this_month_expenses || 0).toFixed(2)}`,
      icon: CalendarDays,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10"
    },
    {
      title: "Average Expense",
      value: `₹${parseFloat(analytics.average_expense || 0).toFixed(2)}`,
      icon: TrendingUp,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10"
    },
    {
      title: "Largest Expense",
      value: `₹${parseFloat(analytics.largest_expense || 0).toFixed(2)}`,
      icon: ArrowUpRight,
      color: "text-rose-500",
      bgColor: "bg-rose-500/10"
    },
    {
      title: "Highest Spender",
      value: analytics.highest_spender || "None",
      icon: Trophy,
      color: "text-indigo-500",
      bgColor: "bg-indigo-500/10"
    },
    {
      title: "Top Category",
      value: analytics.most_frequent_category || "None",
      icon: PieChart,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10"
    },
    {
      title: "Most Active",
      value: analytics.most_active_member || "None",
      icon: Zap,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10"
    },
    {
      title: "Pending Settlements",
      value: `₹${pendingSettlements.toFixed(2)}`,
      icon: HandCoins,
      color: "text-cyan-500",
      bgColor: "bg-cyan-500/10"
    }
  ];

  return (
    <div className="space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary tracking-tight">Dashboard</h1>
          <p className="text-muted mt-1">Here is what's happening with your group's money.</p>
        </div>
        <Button onClick={() => navigate('/expenses/new')} className="shadow-sm">Add Expense</Button>
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {statCards.map((stat, idx) => (
          <div key={idx} className="bg-surface border border-divider rounded-[12px] p-5 shadow-swiss hover:shadow-md transition-shadow duration-200 group">
            <div className="flex items-center gap-3 mb-3">
              <div className={cn("w-10 h-10 rounded-[8px] flex items-center justify-center shrink-0", stat.bgColor, stat.color)}>
                <stat.icon className="w-5 h-5" />
              </div>
              <h3 className="text-xs font-semibold text-muted uppercase tracking-wider line-clamp-1">{stat.title}</h3>
            </div>
            <div className="text-2xl md:text-3xl font-bold text-primary tracking-tight truncate">
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Member Balances Section */}
      <div>
        <h2 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
          Member Balances
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {balances.map((member) => {
            const owesList = suggested.filter(s => s.from === member.member_id);
            const receivesList = suggested.filter(s => s.to === member.member_id);

            return (
              <Card key={member.member_id} className="overflow-hidden hover:shadow-md transition-shadow duration-200">
                <div className="h-1.5 w-full" style={{ backgroundColor: member.color || '#3b82f6' }} />
                <CardHeader className="pb-3 flex flex-row items-center gap-4 border-b border-divider">
                  {member.avatar_url ? (
                    <img src={member.avatar_url} alt={member.name} className="w-14 h-14 rounded-full object-cover ring-2 ring-background shadow-sm" />
                  ) : (
                    <div className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-xl shrink-0 ring-2 ring-background shadow-sm" style={{ backgroundColor: member.color || '#3b82f6' }}>
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <CardTitle className="truncate text-primary text-lg">{member.name}</CardTitle>
                    <div className={cn(
                      "text-sm font-semibold mt-0.5 truncate",
                      member.net_balance > 0 ? "text-emerald-500" :
                      member.net_balance < 0 ? "text-rose-500" :
                      "text-muted"
                    )}>
                      {member.net_balance > 0 ? `Gets back ₹${member.net_balance.toFixed(2)}` :
                       member.net_balance < 0 ? `Owes ₹${Math.abs(member.net_balance).toFixed(2)}` :
                       "Settled up"}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 bg-background/50">
                  <div className="space-y-4">
                    {/* Owes To Section */}
                    {owesList.length > 0 && (
                      <div>
                        <h4 className="text-[10px] font-bold text-rose-500 uppercase tracking-widest mb-2">Owes To</h4>
                        <div className="space-y-2">
                          {owesList.map((s, idx) => (
                            <div key={idx} className="flex justify-between items-center text-sm bg-surface p-2 rounded-[6px] border border-divider/50">
                              <span className="text-muted font-medium truncate">{s.to_name}</span>
                              <span className="font-bold text-rose-600 ml-2 whitespace-nowrap">₹{s.amount.toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Gets Back From Section */}
                    {receivesList.length > 0 && (
                      <div>
                        <h4 className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-2">Gets Back From</h4>
                        <div className="space-y-2">
                          {receivesList.map((s, idx) => (
                            <div key={idx} className="flex justify-between items-center text-sm bg-surface p-2 rounded-[6px] border border-divider/50">
                              <span className="text-muted font-medium truncate">{s.from_name}</span>
                              <span className="font-bold text-emerald-600 ml-2 whitespace-nowrap">₹{s.amount.toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Settled up state */}
                    {owesList.length === 0 && receivesList.length === 0 && (
                      <div className="text-center py-4 text-sm font-medium text-emerald-600/80 bg-emerald-50/50 rounded-[8px] border border-emerald-100">
                        ✨ Fully settled up!
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}