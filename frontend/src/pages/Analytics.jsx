import { useQuery } from '@tanstack/react-query';
import { 
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  BarChart, Bar
} from 'recharts';
import { getAnalytics } from '../lib/api';
import * as Icons from 'lucide-react';

export default function Analytics() {
  const { data, isLoading } = useQuery({
    queryKey: ['analytics'],
    queryFn: getAnalytics,
  });

  if (isLoading) {
    return <div className="text-slate-500 animate-pulse text-center pt-20 font-bold">Loading Analytics...</div>;
  }

  const analytics = data?.data || {
    category_breakdown: [],
    monthly_trend: [],
    expense_frequency: []
  };

  const { category_breakdown, monthly_trend, expense_frequency } = analytics;

  // Render Custom Tooltip for Area Chart
  const CustomAreaTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-surface border border-divider p-3 rounded-[8px] shadow-swiss">
          <p className="text-muted text-xs font-bold uppercase tracking-wider mb-1">{label}</p>
          <p className="text-primary font-black text-lg">₹{payload[0].value.toFixed(2)}</p>
        </div>
      );
    }
    return null;
  };

  // Render Custom Tooltip for Pie Chart
  const CustomPieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-surface border border-divider p-3 rounded-[8px] shadow-swiss flex items-center gap-3">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: data.color }} />
          <div>
            <p className="text-muted text-xs font-bold uppercase tracking-wider">{data.name}</p>
            <p className="text-primary font-black">₹{data.value.toFixed(2)}</p>
          </div>
        </div>
      );
    }
    return null;
  };

  // Render Custom Tooltip for Bar Chart
  const CustomBarTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-surface border border-divider p-3 rounded-[8px] shadow-swiss">
          <p className="text-muted text-xs font-bold uppercase tracking-wider mb-1">{data.name}</p>
          <p className="text-primary font-black">{data.frequency} Expenses</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
          <Icons.PieChart className="w-5 h-5 text-blue-500" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-primary tracking-tight">Analytics</h1>
          <p className="text-sm font-medium text-muted">Deep dive into your spending patterns</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Category Breakdown (Pie Chart) */}
        <div className="bg-surface border border-divider rounded-[16px] p-4 md:p-6 shadow-swiss flex flex-col">
          <div className="flex items-center gap-2 mb-4 md:mb-6">
            <Icons.Donut className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-primary">Category Breakdown</h2>
          </div>
          
          {category_breakdown.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-muted font-medium text-sm">No data available</div>
          ) : (
            <div className="flex-1 flex flex-col md:flex-row items-center gap-6">
              <div className="w-full md:w-1/2 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={category_breakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {category_breakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color || '#ccc'} />
                      ))}
                    </Pie>
                    <RechartsTooltip content={<CustomPieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-full md:w-1/2 space-y-3">
                {category_breakdown.map((item, idx) => {
                  const total = category_breakdown.reduce((sum, curr) => sum + curr.value, 0);
                  const percentage = ((item.value / total) * 100).toFixed(1);
                  
                  return (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color || '#ccc' }} />
                        <span className="text-sm font-bold text-primary">{item.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-black text-primary">{percentage}%</div>
                        <div className="text-xs font-semibold text-muted">₹{item.value.toFixed(0)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Expense Frequency (Bar Chart) */}
        <div className="bg-surface border border-divider rounded-[16px] p-4 md:p-6 shadow-swiss flex flex-col">
          <div className="flex items-center gap-2 mb-4 md:mb-6">
            <Icons.BarChart2 className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-primary">Expense Frequency</h2>
          </div>
          
          {expense_frequency.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-muted font-medium text-sm">No data available</div>
          ) : (
            <div className="flex-1 h-64 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={expense_frequency} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-divider)" opacity={0.5} />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'var(--color-muted)', fontSize: 10, fontWeight: 600 }}
                    dy={10}
                    tickFormatter={(val) => val.length > 8 ? val.substring(0, 8) + '...' : val}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'var(--color-muted)', fontSize: 10, fontWeight: 600 }}
                    width={40}
                  />
                  <RechartsTooltip cursor={{ fill: 'var(--color-surface-hover)' }} content={<CustomBarTooltip />} />
                  <Bar dataKey="frequency" radius={[4, 4, 0, 0]} maxBarSize={50}>
                    {expense_frequency.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || '#3b82f6'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Monthly Trend (Area Chart) */}
        <div className="lg:col-span-2 bg-surface border border-divider rounded-[16px] p-4 md:p-6 shadow-swiss flex flex-col">
          <div className="flex items-center gap-2 mb-4 md:mb-6">
            <Icons.TrendingUp className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-primary">Monthly Trend (Last 6 Months)</h2>
          </div>
          
          {monthly_trend.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-muted font-medium text-sm">No data available</div>
          ) : (
            <div className="h-72 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthly_trend} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-divider)" opacity={0.5} />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'var(--color-muted)', fontSize: 10, fontWeight: 600 }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'var(--color-muted)', fontSize: 10, fontWeight: 600 }}
                    tickFormatter={(value) => `₹${value}`}
                    width={50}
                  />
                  <RechartsTooltip content={<CustomAreaTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="total_amount" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorAmount)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
