import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Sidebar } from '@/components/Sidebar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Calendar, Plus, Users, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ManageMembers } from '@/components/ManageMembers';

// Mock event data
const mockEvents = [
  {
    id: 'e1',
    name: 'Annual Music Concert',
    date: '2025-11-15',
    time: '18:00',
    status: 'upcoming',
    registeredCount: 45,
    imageUrl: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=600&h=400&fit=crop',
  },
  {
    id: 'e2',
    name: 'Workshop: Music Production',
    date: '2025-10-20',
    time: '14:00',
    status: 'upcoming',
    registeredCount: 30,
    imageUrl: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=600&h=400&fit=crop',
  },
  {
    id: 'e3',
    name: 'Freshers Welcome Event',
    date: '2025-09-05',
    time: '16:00',
    status: 'completed',
    registeredCount: 120,
    imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&h=400&fit=crop',
  },
];

const ClubWorkspace = () => {
  const { clubId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('events');
  const [showManageMembers, setShowManageMembers] = useState(false);

  const club = user?.clubs.find(c => c.id === clubId);

  if (!club) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Club Not Found</h2>
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
              {club.imageUrl && (
                <div className="relative h-48 rounded-2xl overflow-hidden mb-6 shadow-xl">
                  <img 
                    src={club.imageUrl} 
                    alt={club.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                  <div className="absolute bottom-6 left-6">
                    <h1 className="text-5xl font-bold text-white drop-shadow-2xl">{club.name}</h1>
                  </div>
                </div>
              )}
              {!club.imageUrl && (
                <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                  {club.name}
                </h1>
              )}
              <p className="text-muted-foreground text-lg">{club.description}</p>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-2 bg-muted/50 backdrop-blur-sm p-1 h-12">
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
                {(user?.role === 'coordinator' || user?.role === 'faculty') && (
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
                {mockEvents.map((event) => (
                  <Card key={event.id} className="overflow-hidden hover:shadow-2xl transition-all duration-500 group border-0 bg-gradient-to-br from-card via-card to-card/80">
                    <div className="flex flex-col md:flex-row">
                      <div className="relative md:w-64 h-48 md:h-auto overflow-hidden bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20">
                        {event.imageUrl ? (
                          <img 
                            src={event.imageUrl} 
                            alt={event.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/30 to-secondary/30">
                            <Calendar className="h-16 w-16 text-primary opacity-50" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                        <Badge 
                          variant={event.status === 'upcoming' ? 'default' : 'secondary'}
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
                              {new Date(event.date).toLocaleDateString('en-US', { 
                                weekday: 'short', 
                                year: 'numeric', 
                                month: 'short', 
                                day: 'numeric' 
                              })}
                            </span>
                            <span>•</span>
                            <span>{event.time}</span>
                            <span>•</span>
                            <span className="flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              {event.registeredCount} registered
                            </span>
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <Button 
                            onClick={() => handleManageEvent(event.id)}
                            className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 shadow-md hover:shadow-xl transition-all duration-300"
                          >
                            Manage Event
                            <ArrowLeft className="ml-2 h-4 w-4 rotate-180 group-hover:translate-x-1 transition-transform" />
                          </Button>
                        </CardContent>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="info" className="space-y-6">
              <Card className="overflow-hidden border-0 bg-gradient-to-br from-card via-card to-card/80">
                <CardHeader className="bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10">
                  <CardTitle className="text-2xl">Club Information</CardTitle>
                  <CardDescription>Details about this club</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <div className="p-4 rounded-lg bg-muted/50 backdrop-blur-sm">
                    <h3 className="font-semibold mb-3 text-lg flex items-center gap-2">
                      <Info className="h-5 w-5 text-primary" />
                      Description
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">{club.description}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50 backdrop-blur-sm">
                    <h3 className="font-semibold mb-3 text-lg flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      Coordinators
                    </h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50">
                        <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        <span className="font-medium">Dr. Faculty Coordinator</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50 backdrop-blur-sm">
                    <h3 className="font-semibold mb-3 text-lg flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      Members
                    </h3>
                    <p className="text-muted-foreground mb-3">45 active members</p>
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
      />
    </div>
  );
};

export default ClubWorkspace;
