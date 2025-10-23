import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Sidebar } from '@/components/Sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button'; // This was not used
import { Badge } from '@/components/ui/badge';
import { Calendar, Users, Ticket, Eye, Heart } from 'lucide-react';
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

async function toggleLike({ eventId, token }: { eventId: string; token: string | null }) {
  if (!token) throw new Error('Not authenticated');
  const res = await fetch(`${API_BASE_URL}/api/events/${eventId}/like`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || 'Like failed');
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

  const likeMutation = useMutation({
    mutationFn: toggleLike,
    onMutate: async ({ eventId }) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ['allEvents'] });

      // Snapshot the previous value
      const previousEvents = queryClient.getQueryData(['allEvents']);

      // Optimistically update to the new value
      queryClient.setQueryData(['allEvents'], (old) =>
        old.map((event) =>
          event._id === eventId
            ? {
                ...event,
                userHasLiked: !event.userHasLiked,
                likesCount: event.userHasLiked ? event.likesCount - 1 : event.likesCount + 1,
              }
            : event
        )
      );

      // Return a context object with the snapshotted value
      return { previousEvents };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['allEvents'], context.previousEvents);
      toast.error('Failed to update like status.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['allEvents'] });
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
      <div className="flex min-h-screen w-full bg-background transition-colors duration-300">
        <Sidebar />
        <main className="flex-1 p-8 transition-all duration-300">
          <div className="max-w-7xl mx-auto">
            <div className="animate-slideInRight mb-8">
              <h1 className="text-4xl font-bold font-poppins mb-2 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">All Upcoming Events</h1>
              <p className="text-muted-foreground transition-colors duration-300">Discover and register for exciting college events</p>
            </div>
            {isLoading && <p className="text-foreground/80 animate-pulse">Loading events...</p>}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 transition-all duration-500">
              {events?.map((event: any, index: number) => (
                <div key={event._id} className="animate-slideUp" style={{ animationDelay: `${index * 0.1}s` }}>
                  <Card className="overflow-hidden transition-all duration-500 ease-out hover:shadow-2xl hover:shadow-primary/30 hover:-translate-y-3 border-primary/10 group animate-bounce-in bg-gradient-to-br from-card to-card/80">
                    <div className="relative h-48 overflow-hidden bg-gradient-to-br from-primary/20 via-accent/20 to-secondary/20 group-hover:from-primary/30 group-hover:to-accent/30 transition-all duration-500">
                      {event.posterImage ? (
                        <img src={`${API_BASE_URL}/api/images/${event.posterImage}`} alt={event.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Calendar className="h-16 w-16 text-primary opacity-50 transition-transform duration-300 group-hover:scale-110" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent group-hover:from-black/90 transition-all duration-300" />
                      <Badge className="absolute top-3 right-3 bg-gradient-to-r from-primary to-accent font-semibold shadow-lg">{event.club?.name || 'College Event'}</Badge>
                    </div>
                    <CardHeader>
                      <CardTitle className="text-2xl font-poppins group-hover:text-primary transition-colors duration-300">{event.name}</CardTitle>
                      <CardDescription className="flex items-center gap-2 pt-2 text-foreground/70">
                        <Calendar className="h-4 w-4" />
                        {new Date(event.startDateTime).toLocaleDateString('en-US', { dateStyle: 'medium' })}
                      </CardDescription>
                      <div className="flex items-center space-x-4 pt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <Eye className="h-4 w-4" />
                          {event.viewsCount || 0}
                        </span>
                        <button
                          className="flex items-center gap-1.5 z-10"
                          onClick={(e) => {
                            e.preventDefault();
                            likeMutation.mutate({ eventId: event._id, token });
                          }}
                        >
                          <Heart className={`h-4 w-4 ${event.userHasLiked ? 'text-red-500 fill-current' : ''}`} />
                          <span>{event.likesCount || 0}</span>
                        </button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-muted-foreground line-clamp-2 min-h-[2.5rem] group-hover:text-foreground/80 transition-colors duration-300">{event.description}</p>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          {event.registeredStudents?.length || 0} Registered
                        </span>
                        {event.requiresFee && <Badge variant="destructive" className="font-semibold">₹{event.feeAmount}</Badge>}
                      </div>
                      {user?.role === 'student' && (
                        <Button
                          className="w-full font-semibold transition-all duration-300"
                          onClick={() => setSelectedEvent(event)}
                          disabled={isAlreadyRegistered(event)}
                        >
                          <Ticket className="mr-2 h-4 w-4" />
                          {isAlreadyRegistered(event) ? 'Registered' : 'Register Now'}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </div>
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
