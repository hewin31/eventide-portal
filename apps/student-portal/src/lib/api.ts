const API_BASE_URL = 'http://localhost:5000/api';

// Define the shape of an Event object to match your database schema
export interface Event {
  _id: string;
  name: string;
  description: string;
  startDateTime: string;
  endDateTime: string;
  venue: string;
  posterImage?: string;
  club: {
    _id: string;
    name?: string; // Make name optional as it might not always be populated
  } | null; // The club can be null if the reference is broken or not populated
  registeredStudents?: string[];
  // Add the new properties for likes and views
  viewsCount?: number;
  likesCount?: number;
  userHasLiked?: boolean;
}

/**
 * Fetches all approved events from the server.
 * This function includes the authentication token in the request headers.
 */
export async function fetchEvents(): Promise<Event[]> {
  // Retrieve the token that AuthContext stored
  const token = localStorage.getItem('campus-event-token');

  const response = await fetch(`${API_BASE_URL}/events`, {
    headers: {
      // Conditionally add the Authorization header if the token exists
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ message: 'Failed to fetch events' }));
    throw new Error(errorBody.message || 'Failed to fetch events. Please try again later.');
  }

  const events: Event[] = await response.json();

  // --- DEBUGGING LOG ---
  // Log the IDs of all events received from the API.
  console.log('API Response: Fetched event IDs:', events.map(event => event._id));
  // --- END DEBUGGING LOG ---

  return events; // The API returns the array of events directly
}

/**
 * Fetches all public events from the server.
 * This function does not require authentication and is safe for guests.
 */
export async function fetchPublicEvents(): Promise<Event[]> {
  const response = await fetch(`${API_BASE_URL}/events/public`);

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ message: 'Failed to fetch public events' }));
    throw new Error(errorBody.message || 'Failed to fetch public events. Please try again later.');
  }

  const events: Event[] = await response.json();

  // Log for debugging purposes
  console.log('API Response: Fetched public event IDs:', events.map(event => event._id));

  return events;
}
