import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSettlements, getSuggestedSettlements, createSettlement, deleteSettlement } from '../lib/api';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

export default function Settlements() {
  const queryClient = useQueryClient();

  const { data: suggestedData, isLoading: loadingSuggested } = useQuery({
    queryKey: ['settlements', 'suggested'],
    queryFn: getSuggestedSettlements,
  });

  const { data: historyData, isLoading: loadingHistory } = useQuery({
    queryKey: ['settlements', 'history'],
    queryFn: getSettlements,
  });

  const mutation = useMutation({
    mutationFn: createSettlement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settlements'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['activity'] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSettlement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settlements'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['activity'] });
    }
  });

  const handleSettle = (suggestion) => {
    mutation.mutate({
      from_member: suggestion.from,
      to_member: suggestion.to,
      amount: suggestion.amount,
      status: 'completed',
      settled_date: new Date().toISOString().split('T')[0]
    });
  };

  const handleUndo = (id) => {
    if (window.confirm("Are you sure you want to undo this settlement?")) {
      deleteMutation.mutate(id);
    }
  };

  if (loadingSuggested || loadingHistory) return <div>Loading...</div>;

  const suggested = suggestedData?.data || [];
  const history = historyData?.data || [];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-primary">Settlements</h1>

      <div>
        <h2 className="text-xl font-bold text-primary mb-4">Suggested Settlements</h2>
        {suggested.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-muted">
              Everyone is settled up! 🎉
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {suggested.map((s, idx) => {
              return (
                <Card key={idx} className="flex items-center justify-between p-6">
                  <div className="flex items-center gap-4">
                    <div className="font-semibold text-red-500">{s.from_name}</div>
                    <ArrowRight className="w-4 h-4 text-muted" />
                    <div className="font-semibold text-emerald-500">{s.to_name}</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-xl font-bold text-primary">₹{s.amount.toFixed(2)}</div>
                    <Button onClick={() => handleSettle(s)} disabled={mutation.isPending}>
                      Settle
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-xl font-bold text-primary mb-4">Recent Settlements</h2>
        <div className="space-y-4">
          {history.length === 0 ? (
            <p className="text-muted">No past settlements.</p>
          ) : (
            history.map(h => (
              <Card key={h.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <div>
                    <div className="flex items-center gap-2 text-primary">
                      <span className="font-medium">{h.from?.name}</span>
                      <ArrowRight className="w-4 h-4 text-muted" />
                      <span className="font-medium">{h.to?.name}</span>
                    </div>
                    <div className="text-sm text-muted">
                      {format(new Date(h.settled_date || h.created_at), 'MMM d, yyyy')}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="font-bold text-primary">₹{parseFloat(h.amount).toFixed(2)}</div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-red-500 hover:text-white hover:bg-red-500 border-red-500/50"
                    onClick={() => handleUndo(h.id)} 
                    disabled={deleteMutation.isPending}
                  >
                    Undo
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
