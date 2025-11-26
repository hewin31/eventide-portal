import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Event } from '@/lib/api';
import { useNavigate } from 'react-router-dom';
import { EventCard } from '@/components/events/EventCard';
import { SignInRequired } from '@/components/auth/SignInRequired';
import { useAuth } from '@/contexts/AuthContext';
import { Sparkles, AlertTriangle } from 'lucide-react';
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
import { toast } from 'sonner';

const API_BASE_URL = 'http://localhost:5000/api';

async function fetchRecommendedEvents({ token }: { token: string | null }): Promise<Event[]> {
  if (!token) throw new Error('Not authenticated');
  const res = await fetch(`${API_BASE_URL}/recommendations`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || 'Failed to fetch recommendations');
  }
  return res.json();
}

async function registerForEvent({ eventId, token }: { eventId: string; token: string | null }) {
  if (!token) throw new Error('Not authenticated');
  const res = await fetch(`${API_BASE_URL}/events/${eventId}/register`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
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
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || 'Failed to toggle like');
  }
  return res.json();
}

export const ForYou = () => {
  const { isAuthenticated, user, token } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const { data: events, error, isLoading } = useQuery({
    queryKey: ['recommendedEvents', user?.id],
    queryFn: () => fetchRecommendedEvents({ token }),
    // Only run the query if the user is authenticated
    enabled: isAuthenticated && !!user?.id,
  });

  const registrationMutation = useMutation({
    mutationFn: registerForEvent,
    onSuccess: (data, variables) => {
      toast.success(`Successfully registered for ${events?.find((e) => e._id === variables.eventId)?.name}!`);
      // Invalidate both recommended events and general events for consistency
      queryClient.invalidateQueries({ queryKey: ['recommendedEvents'] });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recommendedEvents'] });
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

  if (!isAuthenticated) {
    return (
      <SignInRequired description="Please sign in to view personalized recommendations." />
    );
  }

  if (isLoading) {
    return (
      <div className="p-4 md:p-6">
        <p>Loading events...</p>
      </div>
    );
  }

  if (error) {
    // Handle the specific case where the user's profile is incomplete
    if (error.message.includes('User profile is incomplete')) {
      return (
        <div className="p-4 md:p-6 text-center space-y-4">
          <Alert variant="default" className="max-w-md mx-auto text-left">
            <Sparkles className="h-4 w-4" />
            <AlertTitle>Complete Your Profile</AlertTitle>
            <AlertDescription>
              Please set your department and interests to get personalized event recommendations.
            </AlertDescription>
          </Alert>
          <Button onClick={() => navigate('/profile')}>Go to Profile</Button>
        </div>
      );
    }

    return (
      <div className="p-4 md:p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 md:pb-8 px-6 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-secondary flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">For You</h1>
            <p className="text-muted-foreground">Personalized event recommendations</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events?.map((event: Event) => (
            <EventCard
              key={event._id}
              title={event.name}
              club={event.club?.name ?? 'College Event'}
              date={new Date(event.startDateTime).toLocaleDateString('en-US', { dateStyle: 'medium' })}
              time={new Date(event.startDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              venue={event.venue}
              image={event.posterImage ? `http://localhost:5000/api/images/${event.posterImage}` : '/placeholder.png'}
              onRegister={() => isAuthenticated ? setSelectedEvent(event) : null}
              onLike={() => isAuthenticated ? likeMutation.mutate({ eventId: event._id, token }) : null}
              likes={event.likesCount ?? 0}
              isLiked={isAuthenticated && event.userHasLiked}
              isRegistered={isAlreadyRegistered(event)}
              _id={event._id}
            />
          ))}
        </div>
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
};
