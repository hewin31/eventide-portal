import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Sidebar } from '@/components/Sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Edit, UserCog } from 'lucide-react';
import { API_BASE_URL } from '@/lib/utils';
import { toast } from 'sonner';

interface Coordinator {
  _id: string;
  name: string;
  email: string;
  role: 'coordinator' | 'admin' | 'member' | 'student';
}

async function fetchCoordinators(token: string | null) {
  const res = await fetch(`${API_BASE_URL}/api/users/coordinators`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch coordinators');
  return res.json();
}

const CoordinatorForm = ({
  setOpen,
  editingCoordinator,
}: {
  setOpen: (open: boolean) => void;
  editingCoordinator: Coordinator | null;
}) => {
  const [name, setName] = useState(editingCoordinator?.name || '');
  const [email, setEmail] = useState(editingCoordinator?.email || '');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(editingCoordinator?.role || 'coordinator');

  const token = localStorage.getItem('token');
  const queryClient = useQueryClient();

  const coordinatorMutation = useMutation({
    mutationFn: (newCoordinator: Partial<Coordinator> & { password?: string }) => {
      const isEditing = !!editingCoordinator;
      const url = isEditing
        ? `${API_BASE_URL}/api/users/${editingCoordinator._id}`
        : `${API_BASE_URL}/api/users`;
      const method = isEditing ? 'PUT' : 'POST';

      return fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(newCoordinator),
      });
    },
    onSuccess: async (res) => {
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to save coordinator');
      }
      toast.success(`Coordinator ${editingCoordinator ? 'updated' : 'created'} successfully!`);
      queryClient.invalidateQueries({ queryKey: ['coordinators'] });
      setOpen(false);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || (!editingCoordinator && !password)) {
      toast.error('All fields are required.');
      return;
    }
    const payload: Partial<Coordinator> & { password?: string } = { name, email, role };
    if (password) {
      payload.password = password;
    }
    coordinatorMutation.mutate(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} required />
      <Input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <Input type="password" placeholder={editingCoordinator ? 'New Password (optional)' : 'Password'} onChange={(e) => setPassword(e.target.value)} />
      <Select onValueChange={setRole} value={role}>
        <SelectTrigger>
          <SelectValue placeholder="Select a role" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="coordinator">Coordinator</SelectItem>
          <SelectItem value="admin">Admin</SelectItem>
          <SelectItem value="member">Member</SelectItem>
          <SelectItem value="student">Student</SelectItem>
        </SelectContent>
      </Select>
      <Button type="submit" disabled={coordinatorMutation.isPending} className="w-full">
        {coordinatorMutation.isPending ? 'Saving...' : editingCoordinator ? 'Update Coordinator' : 'Create Coordinator'}
      </Button>
    </form>
  );
};

const CoordinatorManagement = () => {
  const [isFormOpen, setFormOpen] = useState(false);
  const [editingCoordinator, setEditingCoordinator] = useState<Coordinator | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<Coordinator | null>(null);
  const token = localStorage.getItem('token');

  const { data: coordinators, isLoading, error } = useQuery<Coordinator[]>({
    queryKey: ['coordinators'],
    queryFn: () => fetchCoordinators(token),
  });

  const queryClient = useQueryClient();
  const deleteCoordinatorMutation = useMutation({
    mutationFn: (coordinatorId: string) => {
      return fetch(`${API_BASE_URL}/api/users/${coordinatorId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
    },
    onSuccess: async (res) => {
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.msg || 'Failed to delete coordinator');
      }
      toast.success('Coordinator deleted successfully!');
      queryClient.invalidateQueries({ queryKey: ['coordinators'] });
      setDeleteCandidate(null);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleEdit = (coordinator: Coordinator) => {
    setEditingCoordinator(coordinator);
    setFormOpen(true);
  };

  const handleCreate = () => {
    setEditingCoordinator(null);
    setFormOpen(true);
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Coordinator Management</h1>
          <Dialog open={isFormOpen} onOpenChange={(open) => {
            if (!open) setEditingCoordinator(null);
            setFormOpen(open);
          }}>
            <DialogTrigger asChild>
              <Button onClick={handleCreate}>
                <Plus className="mr-2 h-4 w-4" /> Create New Coordinator
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingCoordinator ? 'Edit Coordinator' : 'Create a New Coordinator'}</DialogTitle>
              </DialogHeader>
              <CoordinatorForm setOpen={setFormOpen} editingCoordinator={editingCoordinator} />
            </DialogContent>
          </Dialog>
        </div>

        {isLoading && <p>Loading coordinators...</p>}
        {error && <p className="text-red-500">Error loading coordinators.</p>}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {coordinators?.map((coordinator) => (
            <Card key={coordinator._id} className="flex flex-col justify-between">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <UserCog className="mr-3 h-6 w-6 text-primary" />
                  {coordinator.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{coordinator.email}</p>
                <p className="text-sm text-muted-foreground mt-2 capitalize">Role: <span className="font-semibold">{coordinator.role}</span></p>
              </CardContent>
              <div className="p-4 pt-0 mt-auto flex space-x-2">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleEdit(coordinator)}
                >
                  <Edit className="mr-2 h-4 w-4" /> Edit
                </Button>
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => setDeleteCandidate(coordinator)}
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>

        <AlertDialog open={!!deleteCandidate} onOpenChange={() => setDeleteCandidate(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the user <strong>{deleteCandidate?.name}</strong> and remove them from all clubs they are associated with.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteCandidate && deleteCoordinatorMutation.mutate(deleteCandidate._id)}
                disabled={deleteCoordinatorMutation.isPending}
              >
                {deleteCoordinatorMutation.isPending ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
};

export default CoordinatorManagement;
