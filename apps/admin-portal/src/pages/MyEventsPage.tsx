import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button'; // This path is correct, but the file needs to be moved to src/pages
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Link } from 'react-router-dom';

// Define the structure of an Event object based on your Mongoose model
interface Event {
  _id: string;
  name: string;
  description: string;
  startDateTime: string;
  endDateTime: string;
  venue: string;
  poster: string;
  club: {
    _id: string;
    name: string;
  };
  whatsappLink?: string;
  // ... any other event properties
}

const MyEventsPage: React.FC = () => {
  const [myEvents, setMyEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMyEvents = async () => {
      try {
        // Assume the auth token is stored in localStorage after login
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Authentication token not found. Please log in.');
        }

        const response = await fetch('/api/events/my-events', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch your events.');
        }

        const data: Event[] = await response.json();
        setMyEvents(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMyEvents();
  }, []);

  if (loading) {
    return <div>Loading your events...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">My Registered Events</h1>
      {myEvents.length === 0 ? (
        <p>You haven't registered for any events yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {myEvents.map((event) => (
            <Card key={event._id} className="flex flex-col">
              <CardHeader>
                <CardTitle>{event.name}</CardTitle>
                <CardDescription>
                  Organized by: {event.club.name}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <img src={event.poster} alt={`${event.name} poster`} className="rounded-md mb-4" />
                <p><strong>Date:</strong> {new Date(event.startDateTime).toLocaleDateString()}</p>
                <p><strong>Venue:</strong> {event.venue}</p>
              </CardContent>
              <CardFooter className="flex justify-between">
                {event.whatsappLink && (
                  <a href={event.whatsappLink} target="_blank" rel="noopener noreferrer">
                    <Button>Join WhatsApp</Button>
                  </a>
                )}
                {/* Placeholder for QR Code functionality */}
                <Button variant="outline">View QR Code</Button>
                <Link to={`/events/${event._id}`}>
                  <Button variant="secondary">View Details</Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyEventsPage;
