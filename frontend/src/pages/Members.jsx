import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { getMembers, createMember } from '../lib/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { cn } from '../components/ui/Button';

export default function Members() {
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      name: '',
      email: '',
      color: '#3b82f6',
    }
  });

  const { data, isLoading } = useQuery({
    queryKey: ['members'],
    queryFn: getMembers,
  });

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

  const onSubmit = (formData) => {
    mutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Members</h1>
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? 'Cancel' : 'Add Member'}
        </Button>
      </div>

      {showAddForm && (
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                    <Input 
                      type="color" 
                      id="color" 
                      className="w-16 p-1 h-10" 
                      {...register('color', { required: 'Color is required' })} 
                    />
                    <Input 
                      type="text" 
                      value={register('color').value} 
                      {...register('color')} 
                      className="flex-1"
                    />
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
          <Card key={member.id}>
            <CardHeader className="flex flex-row items-center gap-4">
              {member.avatar_url ? (
                <img src={member.avatar_url} alt={member.name} className="w-16 h-16 rounded-full object-cover" />
              ) : (
                <div className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-sm" style={{ backgroundColor: member.color || '#3b82f6' }}>
                  {member.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <CardTitle>{member.name}</CardTitle>
                {member.email && <div className="text-sm text-slate-500 mt-1">{member.email}</div>}
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
