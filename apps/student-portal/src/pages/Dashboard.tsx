import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Event, fetchEvents, fetchPublicEvents } from '@/lib/api';
import { EventCard, EventCardSkeleton } from '@/components/events/EventCard';
import { useAuth } from '@/contexts/AuthContext';
import { LayoutGrid, AlertTriangle, LogIn, Eye, QrCode } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const API_BASE_URL = 'http://localhost:5000/api';

async function registerForEvent({ eventId, token }: { eventId: string; token: string | null }) {
  if (!token) throw new Error('Not authenticated');
  const res = await fetch(`${API_BASE_URL}/events/${eventId}/register`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || 'Registration failed');
  }
  return res.json();
}

async function toggleLikeEvent({ eventId, token }: { eventId: string; token: string | null }) {
  if (!token) throw new Error('Not authenticated');
  const res = await fetch(`${API_BASE_URL}/events/${eventId}/like`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || 'Failed to toggle like');
  }
  return res.json();
}

export function Dashboard() {
  const { isAuthenticated, user, token } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [viewAsGuest, setViewAsGuest] = useState(false);

  // Fetch events for authenticated users
  const { data: authEvents, error: authError, isLoading: authIsLoading } = useQuery({
    queryKey: ['events'],
    queryFn: fetchEvents,
    enabled: isAuthenticated,
  });

  // Fetch public events for guests who choose to view them
  const { data: publicEvents, error: publicError, isLoading: publicIsLoading } = useQuery({
    queryKey: ['publicEvents'],
    queryFn: fetchPublicEvents,
    enabled: !isAuthenticated && viewAsGuest,
  });

  const registrationMutation = useMutation({
    mutationFn: registerForEvent,
    onSuccess: (data, variables) => {
      toast.success(`Successfully registered for ${selectedEvent?.name}!`);
      queryClient.invalidateQueries({ queryKey: ['events'] });
      setSelectedEvent(null);
    },
    onError: (error: Error) => {
      toast.error(error.message);
      setSelectedEvent(null);
    },
  });

  const likeMutation = useMutation({
    mutationFn: toggleLikeEvent,
    // Optimistically update the UI
    onMutate: async ({ eventId }) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ['events'] });

      // Snapshot the previous value
      const previousEvents = queryClient.getQueryData<Event[]>(['events']);

      // Optimistically update to the new value
      queryClient.setQueryData<Event[]>(['events'], (old) =>
        old?.map(event =>
          event._id === eventId
            ? { ...event, userHasLiked: !event.userHasLiked, likesCount: event.likesCount + (event.userHasLiked ? -1 : 1) }
            : event
        )
      );

      // Return a context object with the snapshotted value
      return { previousEvents };
    },
    // If the mutation fails, use the context returned from onMutate to roll back
    onError: (err, variables, context) => {
      if (context?.previousEvents) {
        queryClient.setQueryData(['events'], context.previousEvents);
      }
      toast.error('Failed to update like status.');
    },
    // Always refetch after error or success:
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });

  const handleRegisterConfirm = () => {
    if (selectedEvent) {
      registrationMutation.mutate({ eventId: selectedEvent._id, token });
    }
  };

  const isAlreadyRegistered = (event: Event) => {
    return event.registeredStudents?.includes(user?.id ?? '');
  };

  const renderContent = () => {
    const isLoading = authIsLoading || publicIsLoading;
    const error = authError || publicError;
    const events = authEvents || publicEvents;

    // If the user is a guest and hasn't chosen to view events yet
    if (!isAuthenticated && !viewAsGuest) {
      return (
        <div className="flex flex-col items-center justify-center text-center py-16 px-4 border-2 border-dashed rounded-lg">
          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
            <LogIn className="w-8 h-8 text-secondary-foreground" />
          </div>
          <h2 className="text-2xl font-semibold">Welcome, Guest!</h2>
          <p className="text-muted-foreground mt-2 mb-6 max-w-md">Log in to register for events or browse them as a guest.</p>
          <div className="flex gap-4">
            <Button onClick={() => navigate('/login')}>
              <LogIn className="mr-2 h-4 w-4" /> Go to Login
            </Button>
            <Button variant="outline" onClick={() => setViewAsGuest(true)}>
              <Eye className="mr-2 h-4 w-4" /> View Events as Guest
            </Button>
          </div>
        </div>
      );
    }

    if (isLoading) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 9 }).map((_, i) => (
            <EventCardSkeleton key={i} />
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error Loading Events</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {events?.map((event: Event) => (
          <EventCard
            key={event._id}
            _id={event._id}
            title={event.name}
            club={event.club?.name ?? 'College Event'}
            date={new Date(event.startDateTime).toLocaleDateString('en-US', { dateStyle: 'medium' })}
            time={new Date(event.startDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            venue={event.venue}
            image={event.posterImage ? `${API_BASE_URL}/images/${event.posterImage}` : '/placeholder.png'} // Assuming public images
            onRegister={() => isAuthenticated ? setSelectedEvent(event) : navigate('/login')}
            onLike={() => isAuthenticated ? likeMutation.mutate({ eventId: event._id, token }) : navigate('/login')}
            likes={event.likesCount ?? 0}
            isLiked={isAuthenticated && event.userHasLiked}
            isRegistered={isAuthenticated && isAlreadyRegistered(event)}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen pb-20 md:pb-8 px-6 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <LayoutGrid className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Event Dashboard</h1>
              <p className="text-muted-foreground">All upcoming events on campus</p>
            </div>
          </div>
          {isAuthenticated && (
            <Button onClick={() => navigate('/check-in')}>
              <QrCode className="mr-2 h-4 w-4" />
              Scan QR to Check-in
            </Button>
          )}
        </div>

        {renderContent()}
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
            <AlertDialogAction onClick={handleRegisterConfirm} disabled={registrationMutation.isPending}>
              {registrationMutation.isPending ? 'Registering...' : 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}