import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Sidebar } from '@/components/Sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Users, Ticket } from 'lucide-react';
import { API_BASE_URL } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
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

async function fetchAllEvents(token: string | null) {
  if (!token) throw new Error('Not authenticated');
  const res = await fetch(`${API_BASE_URL}/api/events`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch events');
  return res.json();
}

async function registerForEvent({ eventId, token }: { eventId: string; token: string | null }) {
  if (!token) throw new Error('Not authenticated');
  const res = await fetch(`${API_BASE_URL}/api/events/${eventId}/register`, {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${token}` 
    },
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || 'Registration failed');
  }
  return res.json();
}

const AllEvents = () => {
  const { user } = useAuth();
  const token = localStorage.getItem('token');
  const queryClient = useQueryClient();
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);

  const { data: events, isLoading } = useQuery({
    queryKey: ['allEvents'],
    queryFn: () => fetchAllEvents(token),
    enabled: !!token,
  });

  const registrationMutation = useMutation({
    mutationFn: registerForEvent,
    onSuccess: (data, variables) => {
      toast.success(`Successfully registered for ${events.find(e => e._id === variables.eventId)?.name}!`);
      queryClient.invalidateQueries({ queryKey: ['allEvents'] });
      setSelectedEvent(null);
    },
    onError: (error) => {
      toast.error(error.message);
      setSelectedEvent(null);
    },
  });

  const handleRegisterConfirm = () => {
    if (selectedEvent) {
      registrationMutation.mutate({ eventId: selectedEvent._id, token });
    }
  };

  const isAlreadyRegistered = (event: any) => {
    return event.registeredStudents?.includes(user?.id);
  };

  return (
    <>
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar />
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-4xl font-bold mb-8">All Upcoming Events</h1>
            {isLoading && <p>Loading events...</p>}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {events?.map((event: any) => (
                <Card key={event._id} className="overflow-hidden transition-all duration-300 hover:shadow-primary/20 hover:-translate-y-1">
                  <div className="relative h-48 overflow-hidden bg-gradient-to-br from-primary/20 to-secondary/20">
                    {event.posterImage ? (
                      <img src={`${API_BASE_URL}/api/images/${event.posterImage}`} alt={event.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Calendar className="h-16 w-16 text-primary opacity-50" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    <Badge className="absolute top-3 right-3">{event.club?.name || 'College Event'}</Badge>
                  </div>
                  <CardHeader>
                    <CardTitle className="text-2xl">{event.name}</CardTitle>
                    <CardDescription className="flex items-center gap-2 pt-2">
                      <Calendar className="h-4 w-4" />
                      {new Date(event.startDateTime).toLocaleDateString('en-US', { dateStyle: 'medium' })}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-muted-foreground line-clamp-2 min-h-[2.5rem]">{event.description}</p>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        {event.registeredStudents?.length || 0} Registered
                      </span>
                      {event.requiresFee && <Badge variant="destructive">₹{event.feeAmount}</Badge>}
                    </div>
                    {user?.role === 'student' && (
                      <Button
                        className="w-full"
                        onClick={() => setSelectedEvent(event)}
                        disabled={isAlreadyRegistered(event)}
                      >
                        <Ticket className="mr-2 h-4 w-4" />
                        {isAlreadyRegistered(event) ? 'Registered' : 'Register Now'}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </main>
      </div>

      <AlertDialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Registration</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to register for <strong>{selectedEvent?.name}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRegisterConfirm}
              disabled={registrationMutation.isPending}
            >
              {registrationMutation.isPending ? 'Registering...' : 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default AllEvents;
