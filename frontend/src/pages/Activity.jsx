import { useQuery } from '@tanstack/react-query';
import { getActivity } from '../lib/api';
import { Card, CardContent } from '../components/ui/Card';
import { format, isToday, isYesterday } from 'date-fns';
import * as Icons from 'lucide-react';

function formatDisplayDate(dateString) {
  const date = new Date(dateString);
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'MMM d, yyyy');
}

export default function Activity() {
  const { data: activityData, isLoading, error } = useQuery({
    queryKey: ['activity'],
    queryFn: getActivity
  });

  if (isLoading) return <div className="text-slate-500">Loading activity...</div>;
  if (error) return <div className="text-red-500">Error loading activity</div>;

  const activities = activityData?.data || [];

  if (activities.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-primary">Activity</h1>
        <Card>
          <CardContent className="pt-6 text-center text-muted">
            No activity yet. Add an expense to get started!
          </CardContent>
        </Card>
      </div>
    );
  }

  // Group by date
  const grouped = activities.reduce((acc, curr) => {
    const d = curr.date;
    if (!acc[d]) acc[d] = [];
    acc[d].push(curr);
    return acc;
  }, {});

  const sortedDates = Object.keys(grouped).sort((a, b) => new Date(b) - new Date(a));

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-primary">Activity</h1>

      <div className="space-y-8">
        {sortedDates.map((dateStr) => {
          const items = grouped[dateStr];
          return (
          <div key={dateStr} className="space-y-4">
            <h3 className="text-sm font-semibold text-muted uppercase tracking-wider sticky top-0 bg-background py-2">
              {formatDisplayDate(dateStr)}
            </h3>
            
            <div className="space-y-3 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-divider">
              {items.map((item, idx) => {
                const isExpense = item.type === 'expense';
                
                let Icon = Icons.CheckCircle2;
                if (isExpense) {
                  Icon = item.category?.icon_name && Icons[item.category.icon_name] 
                    ? Icons[item.category.icon_name] 
                    : Icons.Receipt;
                }
                
                const iconColor = isExpense ? item.category?.color : '#10b981';

                return (
                  <div key={item.id + idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-10 h-10 rounded-[8px] border-4 border-background shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10" style={{ backgroundColor: iconColor }}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    
                    <Card className="w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] p-4 hover:ring-2 hover:ring-divider transition-all shadow-none">
                      <div className="flex justify-between items-start mb-1">
                        <div className="font-semibold text-primary truncate pr-2">
                          {isExpense ? item.title : 'Settlement'}
                        </div>
                        <div className="font-bold shrink-0 whitespace-nowrap" style={{ color: isExpense ? item.actor.color : '#10b981' }}>
                          ₹{item.amount.toFixed(2)}
                        </div>
                      </div>
                      
                      <div className="text-sm text-muted">
                        {isExpense ? (
                          <span>
                            <strong style={{ color: item.actor.color }}>{item.actor.name}</strong> paid
                          </span>
                        ) : (
                          <span>
                            <strong style={{ color: item.actor.color }}>{item.actor.name}</strong> paid <strong style={{ color: item.target.color }}>{item.target.name}</strong>
                          </span>
                        )}
                      </div>
                    </Card>
                  </div>
                );
              })}
            </div>
          </div>
        )})}
      </div>
    </div>
  );
}
