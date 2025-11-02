import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { Sidebar } from '@/components/Sidebar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Calendar, Plus, Users, Info, Edit, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';
import { ManageMembers } from '@/components/ManageMembers';
import { API_BASE_URL } from '@/lib/utils';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Coordinator = { _id: string; name: string; };

async function fetchClubDetails(clubId: string, token: string | null) {
  if (!token) throw new Error('Not authenticated');
  const res = await fetch(`${API_BASE_URL}/api/clubs/${clubId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!res.ok) {
    throw new Error('Failed to fetch club details');
  }
  return res.json();
}

async function fetchClubEvents(clubId: string, token: string | null) {
  if (!token) throw new Error('Not authenticated');
  const res = await fetch(`${API_BASE_URL}/api/events/club/${clubId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to fetch events');
  return res.json();
}

async function fetchCoordinators(token: string | null): Promise<Coordinator[]> {
  if (!token) throw new Error("Not authenticated");
  const res = await fetch(`${API_BASE_URL}/api/users/coordinators`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch coordinators");
  return res.json();
}

const ClubWorkspace = () => {
  const { clubId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('events');
  const [showManageMembers, setShowManageMembers] = useState(false);
  const token = localStorage.getItem('token');
  const queryClient = useQueryClient();

  const { data: club, isLoading, error } = useQuery({
    queryKey: ['club', clubId],
    queryFn: () => fetchClubDetails(clubId!, token),
    enabled: !!clubId && !!token,
  });

  const { data: events, isLoading: eventsLoading } = useQuery({
    queryKey: ['events', clubId],
    queryFn: () => fetchClubEvents(clubId!, token),
    enabled: !!clubId && !!token,
  });

  const updateEventStatusMutation = useMutation({
    mutationFn: async ({ eventId, status }: { eventId: string; status: 'approved' | 'rejected' }) => {
      const res = await fetch(`${API_BASE_URL}/api/events/${eventId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'An unknown error occurred' }));
        throw new Error(errorData.error || 'Failed to update event status');
      }

      return res.json();
    },
    onSuccess: () => {
      toast.success('Event status updated!');
      queryClient.invalidateQueries({ queryKey: ['events', clubId] });
    },
    onError: () => {
      toast.error('Failed to update event status.');
    },
  });

  const deleteEventMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const res = await fetch(`${API_BASE_URL}/api/events/${eventId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'An unknown error occurred' }));
        throw new Error(errorData.error || 'Failed to delete event');
      }
      // No JSON body is expected on a successful DELETE, so we don't return res.json()
    },
    onSuccess: () => {
      toast.success('Event deleted successfully!');
      queryClient.invalidateQueries({ queryKey: ['events', clubId] });
    },
    onError: () => {
      toast.error('Failed to delete event.');
    },
  });

  const addCoordinatorMutation = useMutation({
    mutationFn: async (newCoordinatorId: string) => {
      const res = await fetch(`${API_BASE_URL}/api/clubs/${clubId}/coordinators`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ coordinatorId: newCoordinatorId }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ msg: 'An unknown error occurred' }));
        throw new Error(errorData.msg || 'Failed to update coordinator');
      }

      return res.json();
    },
    onSuccess: () => {
      toast.success('Coordinator added successfully!');
      queryClient.invalidateQueries({ queryKey: ['club', clubId] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const removeCoordinatorMutation = useMutation({
    mutationFn: async (coordinatorIdToRemove: string) => {
      const res = await fetch(`${API_BASE_URL}/api/clubs/${clubId}/coordinators/${coordinatorIdToRemove}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ msg: 'An unknown error occurred' }));
        throw new Error(errorData.msg || 'Failed to remove coordinator');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('Coordinator removed successfully!');
      queryClient.invalidateQueries({ queryKey: ['club', clubId] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleAddCoordinator = (newCoordinatorId: string) => {
    addCoordinatorMutation.mutate(newCoordinatorId);
  };
  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center">Loading club...</div>;
  }

  if (error || !club) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">{error ? 'Error loading club' : 'Club Not Found'}</h2>
          <Button onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
        </div>
      </div>
    );
  }

  // Filter out coordinators from the members list to show only regular members
  const regularMembers = club.members?.filter(
    (member: any) => !club.coordinators.some((coordinator: any) => coordinator._id === member._id)
  ) || [];

  return (
    <div className="flex min-h-screen w-full bg-background transition-colors duration-300">
      <Sidebar />
      <main className="flex-1 p-8 transition-all duration-300">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <Button variant="ghost" onClick={() => navigate(user?.role === 'admin' ? '/admin/clubs' : '/dashboard')} className="mb-6 hover:bg-primary/10 transition-all duration-300 font-inter">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Clubs
            </Button>
            <div className="mb-6 animate-slideUp">
              {club.imageUrl ? (
                <div className="relative h-48 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl hover:shadow-primary/30 transition-all duration-500 group">
                  <img
                    src={`${API_BASE_URL}/api/images/${club.imageUrl}`}
                    alt={club.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                  <div className="absolute bottom-6 left-6">
                    <h1 className="text-5xl font-bold font-poppins text-white drop-shadow-2xl transition-all duration-300 group-hover:translate-y-[-4px]">{club.name}</h1>
                  </div>
                </div>
              ) : (
                <h1 className="text-5xl font-bold font-poppins mb-3 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                  {club.name}
                </h1>
              )}
            </div>
            <p className="text-muted-foreground text-lg transition-colors duration-300 font-inter animate-slideUp" style={{ animationDelay: '0.1s' }}>{club.description}</p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-2 bg-muted p-1 h-12 rounded-full">
              <TabsTrigger value="events" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-secondary data-[state=active]:text-white">
                <Calendar className="mr-2 h-4 w-4" />
                Events
              </TabsTrigger>
              <TabsTrigger value="info" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-secondary data-[state=active]:text-white">
                <Info className="mr-2 h-4 w-4" />
                Club Info
              </TabsTrigger>
            </TabsList>

            <TabsContent value="events" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-3xl font-semibold">Club Events</h2>
                {/* Show Create Event button only to club members/coordinators, NOT admins */}
                {user?.role !== 'admin' && club.members.some((member: any) => member._id === user?.id) && (
                  <Button 
                    onClick={() => navigate(`/club/${clubId}/create-event`)}
                    className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 shadow-md hover:shadow-xl transition-all duration-300"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create Event
                  </Button>
                )}
              </div>

              <div className="grid gap-6">
                {eventsLoading && <p>Loading events...</p>}
                {events && events.length > 0 && events.map((event: any, index: number) => (
                  <Card key={event._id} className="overflow-hidden hover:shadow-2xl transition-all duration-300 group border-0 bg-card" style={{ animation: `fadeInUp 0.5s ease-out ${index * 0.1}s both` }}>
                    <div className="flex flex-col md:flex-row">
                      <div className="relative md:w-64 h-48 md:h-auto overflow-hidden">
                        {event.posterImage ? (
                          <img 
                            src={`${API_BASE_URL}/api/images/${event.posterImage}`}
                            alt={event.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
                            <Calendar className="h-16 w-16 text-primary opacity-50" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                        <Badge 
                          variant={event.status === 'approved' ? 'default' : 'secondary'}
                          className="absolute top-4 right-4 shadow-lg"
                        >
                          {event.status}
                        </Badge>
                      </div>
                      <div className="flex-1 flex flex-col">
                        <CardHeader className="flex-1">
                          <CardTitle 
                            className="text-2xl group-hover:text-primary transition-colors cursor-pointer"
                            onClick={() => navigate(`/club/${clubId}/event/${event._id}`)}
                          >
                            {event.name}
                          </CardTitle>
                          <CardDescription className="mt-3 flex flex-wrap items-center gap-4 text-base">
                            <span className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              {new Date(event.startDateTime).toLocaleDateString('en-US', { 
                                weekday: 'short', 
                                year: 'numeric', 
                                month: 'short', 
                                day: 'numeric' 
                              })}
                            </span>
                            <span>•</span>
                            <span>{new Date(event.startDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            <span>•</span>
                            <span className="flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              {event.registeredStudents?.length || 0} registered
                            </span>
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-0 flex items-center gap-4">
                          {/* Admin sees only "View Details". Others see management buttons. */}
                          {user?.role !== 'admin' && (user?._id === event.createdBy || club.coordinators?.some((c: any) => c._id === user?._id)) ? (
                            <>
                              <Button 
                                onClick={() => navigate(`/club/${clubId}/event/${event._id}/edit`)}
                                className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 shadow-md hover:shadow-xl transition-all duration-300"
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Event
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="destructive"
                                    disabled={deleteEventMutation.isPending}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This action cannot be undone. This will permanently delete the event "{event.name}".
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => deleteEventMutation.mutate(event._id)}>Delete</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </>
                          ) : (
                            <Button onClick={() => navigate(`/club/${clubId}/event/${event._id}`)}>View Details</Button>
                          )}
                          {user?.role === 'coordinator' && event.status === 'pending' && ( // Only coordinators see approval buttons
                            <>
                              <Button 
                                variant="outline"
                                onClick={() => updateEventStatusMutation.mutate({ eventId: event._id, status: 'approved' })}
                                disabled={updateEventStatusMutation.isPending}
                              >
                                Approve
                              </Button>
                              <Button 
                                variant="destructive"
                                onClick={() => updateEventStatusMutation.mutate({ eventId: event._id, status: 'rejected' })}
                                disabled={updateEventStatusMutation.isPending}
                              >
                                Reject
                              </Button>
                            </>
                          )}
                        </CardContent>
                      </div>
                    </div>
                  </Card>
                ))}
                {events && events.length === 0 && !eventsLoading && (
                  <div className="text-center py-16 text-muted-foreground">
                    <p>No events found for this club yet.</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="info" className="space-y-6">
              <Card className="overflow-hidden border-0 bg-gradient-to-br from-card via-card to-card/80">
                <CardHeader className="bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl">Club Information</CardTitle>
                    <CardDescription>Details about this club</CardDescription>
                  </div>
                  {(user?.role === 'coordinator' || user?.role === 'admin') && (
                    <Button variant="outline" onClick={() => navigate(`/club/${clubId}/edit`)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Info
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <div className="p-4 rounded-lg bg-muted">
                    <h3 className="font-semibold mb-3 text-lg flex items-center gap-2">
                      <Info className="h-5 w-5 text-primary" />
                      Description
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">{club.description}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted">
                    <h3 className="font-semibold mb-4 text-lg flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" /> Coordinator
                      {club.coordinators?.length > 1 ? 's' : ''}
                    </h3>
                    {club.coordinators && club.coordinators.length > 0 ? (
                      <div className="space-y-3">
                        {club.coordinators.map((coordinator: any) => (
                          <div key={coordinator._id} className="flex items-center justify-between p-3 rounded-lg bg-background">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                                <Users className="h-5 w-5 text-primary" />
                              </div>
                              <span className="font-medium">{coordinator.name}</span>
                            </div>
                            {user?.role === 'admin' && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="destructive" size="sm" disabled={removeCoordinatorMutation.isPending}>
                                    Remove
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Remove {coordinator.name}?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will remove their coordinator privileges for this club. Are you sure?
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => removeCoordinatorMutation.mutate(coordinator._id)}>
                                      Confirm Removal
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-sm">No coordinators assigned.</p>
                    )}
                    {/* --- Admin-specific Coordinator Management --- */}
                    {user?.role === 'admin' && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="mt-4 w-full">
                            <Plus className="mr-2 h-4 w-4" /> Add Coordinator
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader><DialogTitle>Add a New Coordinator</DialogTitle></DialogHeader>
                          <AddCoordinatorForm existingCoordinators={club.coordinators || []} onAddCoordinator={handleAddCoordinator} />
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                  <div className="p-4 rounded-lg bg-muted">
                    <h3 className="font-semibold mb-4 text-lg flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      Members
                    </h3>
                    <p className="text-muted-foreground mb-4">{regularMembers.length || 0} active members</p>
                    {(user?.role === 'coordinator' || user?.role === 'admin') && (
                      <Button 
                        variant="outline" 
                        onClick={() => setShowManageMembers(true)}
                        className="hover:bg-primary/10 hover:border-primary transition-all duration-300"
                      >
                        Manage Members
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <ManageMembers 
        open={showManageMembers} 
        onOpenChange={setShowManageMembers}
        clubName={club.name}
        clubId={club._id}
        currentMembers={regularMembers}
      />
    </div>
  );
};

const AddCoordinatorForm = ({ existingCoordinators, onAddCoordinator }: { existingCoordinators: Coordinator[]; onAddCoordinator: (id: string) => void; }) => {
  const token = localStorage.getItem('token');
  const [selectedCoordinator, setSelectedCoordinator] = useState<string | undefined>();

  const { data: coordinators, isLoading } = useQuery<Coordinator[]>({
    queryKey: ['coordinators'],
    queryFn: () => fetchCoordinators(token),
  });

  // Filter out users who are already coordinators for this club
  const availableCoordinators = coordinators?.filter(c => !existingCoordinators.some(ec => ec._id === c._id));

  return (
    <div className="space-y-4 mt-4">
      <Select onValueChange={setSelectedCoordinator}>
        <SelectTrigger>
          <SelectValue placeholder="Select a user to make coordinator" />
        </SelectTrigger>
        <SelectContent>
          {isLoading ? (
            <SelectItem value="loading" disabled>Loading...</SelectItem>
          ) : availableCoordinators && availableCoordinators.length > 0 ? (
            availableCoordinators.map((c) => <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>)
          ) : <p className="p-4 text-sm text-muted-foreground">No available coordinators found.</p>
          }
        </SelectContent>
      </Select>
      <Button onClick={() => selectedCoordinator && onAddCoordinator(selectedCoordinator)} disabled={!selectedCoordinator} className="w-full">
        Add Coordinator
      </Button>
    </div>
  );
};

export default ClubWorkspace;
