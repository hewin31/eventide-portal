import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Sidebar } from '@/components/Sidebar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Calendar, Plus, Users, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// Mock event data
const mockEvents = [
  {
    id: 'e1',
    name: 'Annual Music Concert',
    date: '2025-11-15',
    time: '18:00',
    status: 'upcoming',
    registeredCount: 45,
  },
  {
    id: 'e2',
    name: 'Workshop: Music Production',
    date: '2025-10-20',
    time: '14:00',
    status: 'upcoming',
    registeredCount: 30,
  },
  {
    id: 'e3',
    name: 'Freshers Welcome Event',
    date: '2025-09-05',
    time: '16:00',
    status: 'completed',
    registeredCount: 120,
  },
];

const ClubWorkspace = () => {
  const { clubId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('events');

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
          <div className="mb-6">
            <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Clubs
            </Button>
            <h1 className="text-4xl font-bold mb-2">{club.name}</h1>
            <p className="text-muted-foreground">{club.description}</p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="events">
                <Calendar className="mr-2 h-4 w-4" />
                Events
              </TabsTrigger>
              <TabsTrigger value="info">
                <Info className="mr-2 h-4 w-4" />
                Club Info
              </TabsTrigger>
            </TabsList>

            <TabsContent value="events" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold">Club Events</h2>
                {user?.role === 'member' && (
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Event
                  </Button>
                )}
              </div>

              <div className="grid gap-4">
                {mockEvents.map((event) => (
                  <Card key={event.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-xl">{event.name}</CardTitle>
                          <CardDescription className="mt-2 flex items-center gap-4">
                            <span>{new Date(event.date).toLocaleDateString()}</span>
                            <span>•</span>
                            <span>{event.time}</span>
                            <span>•</span>
                            <span>{event.registeredCount} registered</span>
                          </CardDescription>
                        </div>
                        <Badge variant={event.status === 'upcoming' ? 'default' : 'secondary'}>
                          {event.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Button onClick={() => handleManageEvent(event.id)}>
                        Manage Event
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="info" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Club Information</CardTitle>
                  <CardDescription>Details about this club</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Description</h3>
                    <p className="text-muted-foreground">{club.description}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Coordinators</h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>Dr. Faculty Coordinator</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Members</h3>
                    <p className="text-muted-foreground">45 active members</p>
                    {user?.role === 'coordinator' && (
                      <Button variant="outline" className="mt-2">
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
    </div>
  );
};

export default ClubWorkspace;
