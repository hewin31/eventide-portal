import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Trash2, Plus, Search, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
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
import { API_BASE_URL } from '@/lib/utils';

interface Member {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'member' | 'coordinator';
  department?: string;
  year?: string;
}

interface SearchResult {
  id: string;
  name: string;
  email: string;
  department?: string;
  year?: string;
}

interface ManageMembersProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clubName: string;
  clubId: string;
  currentMembers: Member[];
}

export function ManageMembers({ open, onOpenChange, clubName, clubId, currentMembers }: ManageMembersProps) {
  const [members, setMembers] = useState<Member[]>(currentMembers);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedUser, setSelectedUser] = useState<SearchResult | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<Member | null>(null);
  const queryClient = useQueryClient();
  const token = localStorage.getItem('token');

  useEffect(() => {
    setMembers(currentMembers);
  }, [currentMembers]);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length > 2) {
      const res = await fetch(`${API_BASE_URL}/api/users?search=${query}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const users = await res.json();
      setSearchResults(users.map((u: any) => ({ ...u, id: u._id })));
    } else {
      setSearchResults([]);
    }
  };

  const handleSelectUser = (user: SearchResult) => {
    setSelectedUser(user);
    setShowAddDialog(true);
    setSearchResults([]);
    setSearchQuery('');
  };

  const handleAddMember = async () => {
    if (!selectedUser) return;

    const res = await fetch(`${API_BASE_URL}/api/clubs/${clubId}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ userId: selectedUser.id })
    });

    if (!res.ok) {
      toast.error("Failed to add member.");
      return;
    }

    await queryClient.invalidateQueries({ queryKey: ['club', clubId] });
    setShowAddDialog(false);
    setSelectedUser(null);
    
    toast.success(`${selectedUser.name} has been added to ${clubName}.`);
  };

  const handleRemoveMember = async () => {
    if (!memberToRemove) return;

    const res = await fetch(`${API_BASE_URL}/api/clubs/${clubId}/members/${memberToRemove._id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!res.ok) {
      toast.error("Failed to remove member.");
      return;
    }

    await queryClient.invalidateQueries({ queryKey: ['club', clubId] });
    toast.success(`${memberToRemove.name} has been removed from the club.`);
    setMemberToRemove(null);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Manage Members - {clubName}</DialogTitle>
            <DialogDescription>
              Add or remove members from your club
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Add Member Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <UserPlus className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Add New Member</h3>
              </div>
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by student email or name..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              {searchResults.length > 0 && (
                <Card className="p-2 max-h-48 overflow-y-auto">
                  {searchResults.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleSelectUser(user)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors text-left"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/20 text-primary">
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{user.name}</p>
                        <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                        {user.department && user.year && (
                          <p className="text-xs text-muted-foreground">{user.department} - {user.year}</p>
                        )}
                      </div>
                      <Plus className="h-5 w-5 text-primary flex-shrink-0" />
                    </button>
                  ))}
                </Card>
              )}
            </div>

            {/* Existing Members List */}
            <div className="space-y-4 pt-6">
              <div className="flex items-center gap-2 mb-3">
                <UserPlus className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Current Members ({members.length})</h3>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {members.map((member) => (
                  <Card key={member.id} className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="bg-primary/20 text-primary text-base">
                            {getInitials(member.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold truncate">{member.name}</h4>
                          <p className="text-sm text-muted-foreground truncate">{member.email}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium capitalize">
                              {member.role}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setMemberToRemove(member)}
                        className="text-destructive hover:bg-destructive/10 flex-shrink-0"
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Member Confirmation Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Member to {clubName}</DialogTitle>
            <DialogDescription className="pt-2">
              Confirm that you want to add this user to the club.
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-4 py-4">
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary/20 text-primary">
                      {getInitials(selectedUser.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{selectedUser.name}</p>
                    <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddMember} className="bg-gradient-to-r from-primary to-secondary">
                  <Plus className="mr-2 h-4 w-4" />
                  Confirm Add
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Remove Member Confirmation */}
      <AlertDialog open={!!memberToRemove} onOpenChange={() => setMemberToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <strong>{memberToRemove?.name}</strong> from the club?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveMember}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
