import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { Sidebar } from '@/components/Sidebar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Calendar, Plus, Users, Info, Edit } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ManageMembers } from '@/components/ManageMembers';
import { API_BASE_URL } from '@/lib/utils';
import { toast } from 'sonner';

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
    mutationFn: ({ eventId, status }: { eventId: string; status: 'approved' | 'rejected' }) => {
      return fetch(`${API_BASE_URL}/api/events/${eventId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
    },
    onSuccess: () => {
      toast.success('Event status updated!');
      queryClient.invalidateQueries({ queryKey: ['events', clubId] });
    },
    onError: () => {
      toast.error('Failed to update event status.');
    },
  });

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

  const handleManageEvent = (eventId: string) => {
    navigate(`/club/${clubId}/event/${eventId}`);
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mb-6 hover:bg-primary/10">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Clubs
            </Button>
            <div className="mb-6">
              {club.imageUrl ? (
                <div className="relative h-48 rounded-2xl overflow-hidden">
                  <img 
                    src={`${API_BASE_URL}/api/images/${club.imageUrl}`}
                    alt={club.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                  <div className="absolute bottom-6 left-6">
                    <h1 className="text-5xl font-bold text-white drop-shadow-2xl">{club.name}</h1>
                  </div>
                </div>
              ) : (
                <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                  {club.name}
                </h1>
              )}
            </div>
            <p className="text-muted-foreground text-lg">{club.description}</p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-2 bg-muted p-1 h-12">
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
                {user?.role === 'member' && (
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
                {events && events.length > 0 && events.map((event: any) => (
                  <Card key={event._id} className="overflow-hidden hover:shadow-2xl transition-all duration-500 group border-0 bg-gradient-to-br from-card via-card to-card/80">
                    <div className="flex flex-col md:flex-row">
                      <div className="relative md:w-64 h-48 md:h-auto overflow-hidden bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20">
                        {event.posterImage ? (
                          <img 
                            src={`${API_BASE_URL}/api/images/${event.posterImage}`}
                            alt={event.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
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
                          <CardTitle className="text-2xl group-hover:text-primary transition-colors">
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
                          <Button 
                            onClick={() => handleManageEvent(event._id)}
                            className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 shadow-md hover:shadow-xl transition-all duration-300"
                          >
                            Manage Event
                            <ArrowLeft className="ml-2 h-4 w-4 rotate-180 group-hover:translate-x-1 transition-transform" />
                          </Button>
                          {user?.role === 'coordinator' && event.status === 'pending' && (
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
                  {user?.role === 'coordinator' && (
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
                      <Users className="h-5 w-5 text-primary" />
                      Coordinators
                    </h3>
                    {club.coordinator ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-background">
                          <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                            <Users className="h-5 w-5 text-primary" />
                          </div>
                          <span className="font-medium">{club.coordinator.name}</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-sm">No coordinator assigned.</p>
                    )}
                  </div>
                  <div className="p-4 rounded-lg bg-muted">
                    <h3 className="font-semibold mb-4 text-lg flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      Members
                    </h3>
                    <p className="text-muted-foreground mb-4">{club.members?.length || 0} active members</p>
                    {user?.role === 'coordinator' && (
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
        currentMembers={club.members}
      />
    </div>
  );
};

export default ClubWorkspace;
