import { useQuery } from "@tanstack/react-query";
import { EventCard, EventCardSkeleton } from "@/components/events/EventCard";
import { SignInRequired } from "@/components/auth/SignInRequired";
import { useAuth } from "@/contexts/AuthContext";
import { Calendar, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Event } from "@/lib/api";

const API_BASE_URL = "http://localhost:5000/api";

async function fetchMyEvents(token: string | null): Promise<Event[]> {
  if (!token) throw new Error("Not authenticated");
  const res = await fetch(`${API_BASE_URL}/events/my-events`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error("Failed to fetch your registered events.");
  }
  return res.json();
}

export const MyEvents = () => {
  const { isAuthenticated, token } = useAuth();

  const { data: registeredEvents, isLoading, error } = useQuery({
    queryKey: ["myEvents"],
    queryFn: () => fetchMyEvents(token),
    enabled: isAuthenticated,
  });
  if (!isAuthenticated) {
    return (
      <SignInRequired description="Sign in to manage your registered events." />
    );
  }

  return (
    <div className="min-h-screen pb-20 md:pb-8 px-6 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">My Events</h1>
            {!isLoading && !error && (
              <p className="text-muted-foreground">
                {registeredEvents?.length || 0} event
                {registeredEvents?.length !== 1 ? "s" : ""} registered
              </p>
            )}
          </div>
        </div>

        {(() => {
          if (isLoading) {
            return (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 3 }).map((_, i) => (
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

          if (registeredEvents && registeredEvents.length > 0) {
            return (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {registeredEvents.map((event) => (
                  <EventCard
                    key={event._id}
                    title={event.name}
                    club={event.club?.name ?? "College Event"}
                    date={new Date(event.startDateTime).toLocaleDateString('en-US', { dateStyle: 'medium' })}
                    time={new Date(event.startDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    venue={event.venue}
                    image={event.posterImage ? `${API_BASE_URL}/images/${event.posterImage}` : '/placeholder.png'}
                    isRegistered={true}
                    onRegister={() => {}}
                  />
                ))}
              </div>
            );
          }

          return (
            <div className="text-center py-16 bg-muted/30 rounded-2xl">
              <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No events yet</h3>
              <p className="text-muted-foreground">
                Register for events to see them here
              </p>
            </div>
          );
        })()}
      </div>
    </div>
  );
};
