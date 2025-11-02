import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
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
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Building, Trash2 } from 'lucide-react';
import { API_BASE_URL } from '@/lib/utils';
import { toast } from 'sonner';

interface Club {
  _id: string;
  name: string;
  description: string;
  coordinator?: { name: string };
}

interface Coordinator {
  _id: string;
  name: string;
}

async function fetchAllClubs(token: string | null) {
  const res = await fetch(`${API_BASE_URL}/api/clubs`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch clubs');
  return res.json();
}

async function fetchCoordinators(token: string | null) {
  const res = await fetch(`${API_BASE_URL}/api/users/coordinators`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch coordinators');
  return res.json();
}

const CreateClubForm = ({ setOpen }: { setOpen: (open: boolean) => void }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [coordinatorId, setCoordinatorId] = useState<string | undefined>();
  const token = localStorage.getItem('token');
  const queryClient = useQueryClient();

  const { data: coordinators, isLoading: coordinatorsLoading } = useQuery<Coordinator[]>({
    queryKey: ['coordinators'],
    queryFn: () => fetchCoordinators(token),
  });

  const createClubMutation = useMutation({
    mutationFn: (newClub: { name: string; description: string; coordinatorId?: string }) => {
      return fetch(`${API_BASE_URL}/api/clubs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(newClub),
      });
    },
    onSuccess: async (res) => {
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to create club');
      }
      toast.success('Club created successfully!');
      queryClient.invalidateQueries({ queryKey: ['clubs'] });
      setOpen(false);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !description) {
      toast.error('Name and description are required.');
      return;
    }
    createClubMutation.mutate({ name, description, coordinatorId });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input placeholder="Club Name" value={name} onChange={(e) => setName(e.target.value)} required />
      <Textarea placeholder="Club Description" value={description} onChange={(e) => setDescription(e.target.value)} required />
      <Select onValueChange={setCoordinatorId} value={coordinatorId}>
        <SelectTrigger>
          <SelectValue placeholder="Select a coordinator (optional)" />
        </SelectTrigger>
        <SelectContent>
          {coordinatorsLoading ? (
            <SelectItem value="loading" disabled>Loading...</SelectItem>
          ) : (
            coordinators?.map((c) => <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>)
          )}
        </SelectContent>
      </Select>
      <Button type="submit" disabled={createClubMutation.isPending} className="w-full">
        {createClubMutation.isPending ? 'Creating...' : 'Create Club'}
      </Button>
    </form>
  );
};

const AdminDashboard = () => {
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [deleteCandidate, setDeleteCandidate] = useState<Club | null>(null);
  const token = localStorage.getItem('token');
  const navigate = useNavigate();

  const { data: clubs, isLoading, error } = useQuery<Club[]>({
    queryKey: ['clubs'],
    queryFn: () => fetchAllClubs(token),
  });

  const queryClient = useQueryClient();
  const deleteClubMutation = useMutation({
    mutationFn: (clubId: string) => {
      return fetch(`${API_BASE_URL}/api/clubs/${clubId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
    },
    onSuccess: async (res) => {
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.msg || 'Failed to delete club');
      }
      toast.success('Club deleted successfully!');
      queryClient.invalidateQueries({ queryKey: ['clubs'] });
      setDeleteCandidate(null);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Club Management</h1>
          <Dialog open={isCreateOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Create New Club
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create a New Club</DialogTitle>
              </DialogHeader>
              <CreateClubForm setOpen={setCreateOpen} />
            </DialogContent>
          </Dialog>
        </div>

        {isLoading && <p>Loading clubs...</p>}
        {error && <p className="text-red-500">Error loading clubs.</p>}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clubs?.map((club) => (
            <Card key={club._id} className="hover:shadow-lg transition-shadow flex flex-col">
              <CardHeader className="cursor-pointer" onClick={() => navigate(`/club/${club._id}`)}>
                <CardTitle className="flex items-center gap-3">
                  <Building className="h-6 w-6 text-primary" />
                  {club.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-grow cursor-pointer" onClick={() => navigate(`/club/${club._id}`)}>
                <p className="text-muted-foreground line-clamp-2">{club.description}</p>
                <p className="text-sm text-muted-foreground mt-4">
                  Coordinator: <span className="font-semibold">{club.coordinator?.name || 'Not Assigned'}</span>
                </p>
              </CardContent>
              <div className="p-4 pt-0 mt-auto">
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteCandidate(club);
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Delete Club
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
                This action cannot be undone. This will permanently delete the <strong>{deleteCandidate?.name}</strong> club and remove all associated members.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteCandidate && deleteClubMutation.mutate(deleteCandidate._id)}
                disabled={deleteClubMutation.isPending}
              >
                {deleteClubMutation.isPending ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
};

export default AdminDashboard;