import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Sidebar } from '@/components/Sidebar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Edit, Megaphone } from 'lucide-react';
import { API_BASE_URL } from '@/lib/utils';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from 'date-fns';

interface Announcement {
  _id: string;
  message: string;
  expiryDate?: string;
  createdBy: { name: string };
  createdAt: string;
}

async function fetchAnnouncements(token: string | null): Promise<Announcement[]> {
  const res = await fetch(`${API_BASE_URL}/api/announcements`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch announcements');
  return res.json();
}

const AnnouncementForm = ({ setOpen, editingAnnouncement }: { setOpen: (open: boolean) => void; editingAnnouncement: Announcement | null }) => {
  const [message, setMessage] = useState(editingAnnouncement?.message || '');
  const [expiryDate, setExpiryDate] = useState(editingAnnouncement?.expiryDate ? format(new Date(editingAnnouncement.expiryDate), "yyyy-MM-dd'T'HH:mm") : '');
  const token = localStorage.getItem('token');
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (payload: { message: string; expiryDate?: string }) => {
      const isEditing = !!editingAnnouncement;
      const url = isEditing ? `${API_BASE_URL}/api/announcements/${editingAnnouncement._id}` : `${API_BASE_URL}/api/announcements`;
      const method = isEditing ? 'PUT' : 'POST';
      return fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
    },
    onSuccess: async (res) => {
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to save announcement');
      }
      toast.success(`Announcement ${editingAnnouncement ? 'updated' : 'created'} successfully!`);
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      setOpen(false);
    },
    onError: (error) => toast.error(error.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message) {
      toast.error('Message is required.');
      return;
    }
    mutation.mutate({ message, expiryDate: expiryDate || undefined });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Textarea placeholder="Announcement Message" value={message} onChange={(e) => setMessage(e.target.value)} required />
      <div className="space-y-2">
        <Label htmlFor="expiry-date">Expiry Date (Optional)</Label>
        <Input id="expiry-date" type="datetime-local" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
      </div>
      <Button type="submit" disabled={mutation.isPending} className="w-full">
        {mutation.isPending ? 'Saving...' : editingAnnouncement ? 'Update Announcement' : 'Create Announcement'}
      </Button>
    </form>
  );
};

const AnnouncementManagement = () => {
  const [isFormOpen, setFormOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<Announcement | null>(null);
  const token = localStorage.getItem('token');
  const queryClient = useQueryClient();

  const { data: announcements, isLoading, error } = useQuery<Announcement[]>({
    queryKey: ['announcements'],
    queryFn: () => fetchAnnouncements(token),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fetch(`${API_BASE_URL}/api/announcements/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } }),
    onSuccess: () => {
      toast.success('Announcement deleted!');
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      setDeleteCandidate(null);
    },
    onError: () => toast.error('Failed to delete announcement.'),
  });

  const handleEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setFormOpen(true);
  };

  const handleCreate = () => {
    setEditingAnnouncement(null);
    setFormOpen(true);
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Announcements</h1>
          <Dialog open={isFormOpen} onOpenChange={(open) => { if (!open) setEditingAnnouncement(null); setFormOpen(open); }}>
            <DialogTrigger asChild>
              <Button onClick={handleCreate}><Plus className="mr-2 h-4 w-4" /> Create Announcement</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingAnnouncement ? 'Edit Announcement' : 'Create New Announcement'}</DialogTitle>
              </DialogHeader>
              <AnnouncementForm setOpen={setFormOpen} editingAnnouncement={editingAnnouncement} />
            </DialogContent>
          </Dialog>
        </div>

        {isLoading && <p>Loading...</p>}
        {error && <p className="text-red-500">Error loading announcements.</p>}

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Message</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {announcements?.map((ann) => (
                <TableRow key={ann._id}>
                  <TableCell className="font-medium max-w-sm truncate">{ann.message}</TableCell>
                  <TableCell>{ann.expiryDate ? format(new Date(ann.expiryDate), 'PPp') : 'Never'}</TableCell>
                  <TableCell>{ann.createdBy?.name || 'N/A'}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(ann)}><Edit className="h-4 w-4" /></Button>
                    <Button variant="destructive" size="sm" onClick={() => setDeleteCandidate(ann)}><Trash2 className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        <AlertDialog open={!!deleteCandidate} onOpenChange={() => setDeleteCandidate(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the announcement. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => deleteCandidate && deleteMutation.mutate(deleteCandidate._id)} disabled={deleteMutation.isPending}>
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
};

export default AnnouncementManagement;
