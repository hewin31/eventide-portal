import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Sidebar } from '@/components/Sidebar';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Edit, UserCog, Search } from 'lucide-react';
import { API_BASE_URL } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Label } from '@/components/ui/label';

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'coordinator' | 'admin' | 'member' | 'student';
}

interface FetchUsersResponse {
  users: User[];
  totalUsers: number;
  currentPage: number;
  limit: number;
}

async function fetchUsers(token: string | null, search: string = '', page: number = 1, limit: number = 10): Promise<FetchUsersResponse> {
  const url = `${API_BASE_URL}/api/users/all?page=${page}&limit=${limit}&search=${search}`;
  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch users');
  return res.json();
}

const UserForm = ({
  setOpen,
  editingUser,
}: {
  setOpen: (open: boolean) => void;
  editingUser: User | null;
}) => {
  const [name, setName] = useState(editingUser?.name || '');
  const [email, setEmail] = useState(editingUser?.email || '');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(editingUser?.role || 'member');

  const token = localStorage.getItem('token');
  const queryClient = useQueryClient();

  const userMutation = useMutation({
    mutationFn: (newUser: Partial<User> & { password?: string }) => {
      const isEditing = !!editingUser;
      const url = isEditing
        ? `${API_BASE_URL}/api/users/${editingUser._id}`
        : `${API_BASE_URL}/api/users`;
      const method = isEditing ? 'PUT' : 'POST';

      return fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(newUser),
      });
    },
    onSuccess: async (res) => {
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to save user');
      }
      toast.success(`User ${editingUser ? 'updated' : 'created'} successfully!`);
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setOpen(false);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || (!editingUser && !password)) {
      toast.error('All fields are required.');
      return;
    }
    const payload: Partial<User> & { password?: string } = { name, email, role };
    if (password) {
      payload.password = password;
    }
    userMutation.mutate(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} required />
      <Input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <Input type="password" placeholder={editingUser ? 'New Password (optional)' : 'Password'} onChange={(e) => setPassword(e.target.value)} />
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
      <Button type="submit" disabled={userMutation.isPending} className="w-full">
        {userMutation.isPending ? 'Saving...' : editingUser ? 'Update User' : 'Create User'}
      </Button>
    </form>
  );
};

const UserManagement = () => {
  const [isFormOpen, setFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<User | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const token = localStorage.getItem('token');

  const { data: usersData, isLoading, error } = useQuery<FetchUsersResponse>({
    queryKey: ['users', search, page],
    queryFn: () => fetchUsers(token, search, page),
  });

  const queryClient = useQueryClient();
  const deleteUserMutation = useMutation({
    mutationFn: (userId: string) => {
      return fetch(`${API_BASE_URL}/api/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
    },
    onSuccess: async (res) => {
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.msg || 'Failed to delete user');
      }
      toast.success('User deleted successfully!');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setDeleteCandidate(null);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormOpen(true);
  };

  const handleCreate = () => {
    setEditingUser(null);
    setFormOpen(true);
  };

  const totalPages = usersData ? Math.ceil(usersData.totalUsers / usersData.limit) : 0;

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">User Management</h1>
          <div className="flex items-center space-x-4">
           <div className="relative">
              <Input
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => {
                   setSearch(e.target.value);
                   setPage(1); // Reset to the first page when searching
                }}
                className="pl-10"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
           </div>
            <Dialog open={isFormOpen} onOpenChange={(open) => {
              if (!open) setEditingUser(null);
              setFormOpen(open);
            }}>
              <DialogTrigger asChild>
                <Button onClick={handleCreate}>
                  <Plus className="mr-2 h-4 w-4" /> Create New User
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingUser ? 'Edit User' : 'Create a New User'}</DialogTitle>
                </DialogHeader>
                <UserForm setOpen={setFormOpen} editingUser={editingUser} />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {isLoading && <p>Loading users...</p>}
        {error && <p className="text-red-500">Error loading users.</p>}

        <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
          <Table>
            <TableCaption>A list of all users in your account. </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usersData?.users.map((user) => (
                <TableRow key={user._id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(user)}>
                      <Edit className="mr-2 h-4 w-4" /> Edit
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => setDeleteCandidate(user)}>
                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={4} className="text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <Label>Page</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <Input
                      type="number"
                      value={page}
                      onChange={(e) => {
                        const newPage = parseInt(e.target.value);
                        if (!isNaN(newPage) && newPage > 0 && newPage <= totalPages) {
                          setPage(newPage);
                        }
                      }}
                      className="w-16 text-center"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page === totalPages}
                    >
                      Next
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      {page} of {totalPages}
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>

        <AlertDialog open={!!deleteCandidate} onOpenChange={() => setDeleteCandidate(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the user <strong>{deleteCandidate?.name}</strong>.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteCandidate && deleteUserMutation.mutate(deleteCandidate._id)}
                disabled={deleteUserMutation.isPending}
              >
                {deleteUserMutation.isPending ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
};

export default UserManagement;
