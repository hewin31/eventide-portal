import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  Clock,
  Info,
  DollarSign,
  ExternalLink,
  Phone,
  Loader2,
  AlertTriangle,
  Heart,
  Eye,
  MessageSquare,
  Send,
  User,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

// This should point to your backend API URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface ContactPerson {
  name: string;
  phone: string;
  designation?: string;
  whatsappLink: string;
}

interface Reply {
  _id: string;
  text: string;
  user: {
    name: string;
    role: 'student' | 'coordinator' | 'admin';
  };
  createdAt: string;
}

interface Comment {
  _id: string;
  text: string;
  user: {
    name: string;
    role: 'student' | 'coordinator' | 'admin';
  };
  createdAt: string;
  replies: Reply[];
}

interface EventDetails {
  _id: string;
  name: string;
  description: string;
  club: { name: string };
  eventType: 'technical' | 'non-technical' | 'workshop' | 'cultural' | 'sports';
  eventCategory: 'club' | 'department' | 'college';
  startDateTime: string;
  endDateTime: string;
  registrationDeadline?: string;
  venue: string;
  mode: 'online' | 'offline' | 'hybrid';
  posterImage: string;
  requiresFee: boolean;
  feeAmount?: number;
  teamSize: number;
  totalCapacity: number;
  remainingCapacity: number;
  eligibility?: string;
  registrationLink?: string;
  contactPersons: ContactPerson[];
  registeredStudents: string[];
  viewsCount: number;
  likesCount: number;
  userHasLiked?: boolean;
  comments: Comment[];
}

async function fetchEventDetails(eventId: string): Promise<EventDetails> {
  const url = `${API_BASE_URL}/events/public/${eventId}`;
  const response = await fetch(url);
  
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ message: 'Failed to fetch event details' }));
    throw new Error(errorBody.message || 'Failed to fetch event details');
  }

  return response.json();
}

async function registerForEvent({ eventId, token }: { eventId: string; token: string | null }) {
  if (!token) throw new Error('Not authenticated');
  
  const response = await fetch(`${API_BASE_URL}/events/${eventId}/register`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Registration failed');
  }

  return response.json();
}

async function unregisterFromEvent({ eventId, token }: { eventId: string; token: string | null }) {
  if (!token) throw new Error('Not authenticated');

  const response = await fetch(`${API_BASE_URL}/events/${eventId}/unregister`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Unregistration failed');
  }

  return response.json();
}

async function toggleLikeEvent({ eventId, token }: { eventId: string; token: string | null }) {
  if (!token) throw new Error('Not authenticated');

  const response = await fetch(`${API_BASE_URL}/events/${eventId}/like`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to toggle like');
  }

  return response.json();
}

async function postComment({ eventId, text, token }: { eventId: string; text: string; token: string | null }) {
  if (!token) throw new Error('Not authenticated');

  const response = await fetch(`${API_BASE_URL}/events/${eventId}/comments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to post comment');
  }
  return response.json();
}

async function postReply({ eventId, commentId, text, token }: { eventId: string; commentId: string; text: string; token: string | null }) {
  if (!token) throw new Error('Not authenticated');

  const response = await fetch(`${API_BASE_URL}/events/${eventId}/comments/${commentId}/replies`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Failed to post reply.' }));
    throw new Error(errorData.error || 'Failed to post reply.');
  }
  return response.json();
}


export const EventDetailsPage = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated, token } = useAuth();
  const queryClient = useQueryClient();

  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ commentId: string; text: string } | null>(null);

  const { data: event, isLoading, isError } = useQuery<EventDetails>({
    queryKey: ['event', eventId],
    queryFn: () => {
      if (!eventId) throw new Error('Event ID is missing');
      // Record a view when fetching details
      if (isAuthenticated) {
        fetch(`${API_BASE_URL}/events/${eventId}/view`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        }).catch(err => console.error("Failed to record view:", err));
      }
      return fetchEventDetails(eventId);
    },
    enabled: !!eventId,
  });

  const likeMutation = useMutation({
    mutationFn: toggleLikeEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
    },
  });

  const registrationMutation = useMutation({
    mutationFn: () => registerForEvent({ eventId: eventId!, token }),
    onSuccess: () => {
      toast.success('Successfully registered for the event!');
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to register');
    },
  });

  const unregisterMutation = useMutation({
    mutationFn: () => unregisterFromEvent({ eventId: eventId!, token }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      toast.success('Successfully unregistered from the event');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to unregister');
    },
  });

  const commentMutation = useMutation({
    mutationFn: (text: string) => postComment({ eventId: eventId!, text, token }),
    onSuccess: () => {
      toast.success('Comment posted!');
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      setNewComment('');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to post comment.');
    },
  });

  const handlePostComment = () => {
    if (newComment.trim()) {
      commentMutation.mutate(newComment);
    }
  };

  const replyMutation = useMutation({
    mutationFn: ({ commentId, text }: { commentId: string; text: string }) => postReply({ eventId: eventId!, commentId, text, token }),
    onSuccess: () => {
      toast.success('Reply posted!');
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      setReplyingTo(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to post reply.');
    },
  });

  useEffect(() => {
    if (isError) {
      toast.error('Could not load event details.');
      navigate('/');
    }
  }, [isError, navigate]);

  if (!eventId) {
    return (
      <div className="min-h-screen pb-20 md:pb-8 px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>Event ID not found</AlertDescription>
          </Alert>
          <Button onClick={() => navigate('/')} className="mt-4">
            Back to Events
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen pb-20 md:pb-8 px-6 py-8 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !event) {
    return (
      <div className="min-h-screen pb-20 md:pb-8 px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error Loading Event</AlertTitle>
            <AlertDescription>
              {isError ? 'Failed to load event details' : 'Event not found'}
            </AlertDescription>
          </Alert>
          <Button onClick={() => navigate('/')} className="mt-4">
            Back to Events
          </Button>
        </div>
      </div>
    );
  }

  const isRegistered = user ? event.registeredStudents.includes(user.id) : false;
  const spotsAvailable = event.remainingCapacity;

  const startDate = new Date(event.startDateTime);
  const endDate = new Date(event.endDateTime);
  const dateStr = startDate.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
  const startTimeStr = startDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  const endTimeStr = endDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

  return (
    <div className="min-h-screen pb-20 md:pb-8 px-6 py-8 bg-background">
      <div className="max-w-4xl mx-auto">
        <Button variant="outline" onClick={() => navigate('/')} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Events
      </Button>

        <div className="space-y-6">
          <div className="rounded-lg overflow-hidden border border-border">
            <img src={`${(import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '')}/api/images/${event.posterImage}`} alt={event.name} className="w-full h-96 object-cover" />
          </div>

          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-foreground">{event.name}</h1>
            <p className="text-xl text-muted-foreground">by {event.club.name}</p>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Eye className="w-5 h-5" />
              <span>{event.viewsCount.toLocaleString()} views</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Button variant="ghost" size="icon" onClick={() => likeMutation.mutate({ eventId: event._id, token })} disabled={!isAuthenticated || likeMutation.isPending}>
                <Heart className={`w-5 h-5 ${event.userHasLiked ? 'text-red-500 fill-current' : ''}`} />
              </Button>
              <span>{event.likesCount.toLocaleString()} likes</span>
            </div>
          </div>



          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-6">
              <Card className="p-6 space-y-4">
                <h2 className="text-lg font-semibold text-foreground">Event Details</h2>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Date & Time</p>
                      <p className="text-base font-medium text-foreground">{dateStr}</p>
                      <p className="text-sm text-muted-foreground">{startTimeStr} - {endTimeStr}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Venue</p>
                      <p className="text-base font-medium text-foreground">{event.venue}</p>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-6 space-y-4">
                <h2 className="text-lg font-semibold text-foreground">About</h2>
                <p className="text-base text-foreground leading-relaxed">{event.description}</p>
              </Card>

              {event.eligibility && (
                <Card className="p-6 space-y-4">
                  <h2 className="text-lg font-semibold text-foreground">Eligibility</h2>
                  <p className="text-base text-foreground">{event.eligibility}</p>
                </Card>
              )}

              {event.contactPersons && event.contactPersons.length > 0 && (
                <Card className="p-6 space-y-4">
                  <h2 className="text-lg font-semibold text-foreground">Contact</h2>
                  <div className="space-y-4">
                    {event.contactPersons.map((contact, idx) => (
                      <div key={idx} className="p-4 bg-card border border-border rounded-lg space-y-2">
                        <div className="flex items-start gap-3">
                          <Users className="w-4 h-4 text-muted-foreground mt-1 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="font-medium text-foreground">{contact.name}</p>
                            {contact.designation && <p className="text-sm text-muted-foreground">{contact.designation}</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <a href={`tel:${contact.phone}`} className="text-primary hover:underline text-sm">{contact.phone}</a>
                        </div>
                        {contact.whatsappLink && (
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-muted-foreground">WhatsApp:</span>
                            <a href={contact.whatsappLink} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm">Open Chat</a>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              <Card className="p-6 space-y-4">
                <h2 className="text-lg font-semibold text-foreground">Comments</h2>
                {isAuthenticated ? (
                  <div className="flex items-center gap-2">
                    <input
                      placeholder="Write a comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                    <Button onClick={handlePostComment} disabled={commentMutation.isPending}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    <a href="/login" className="text-primary hover:underline">Sign in</a> to post a comment.
                  </p>
                )}

                <div className="space-y-6">
                  {event.comments && event.comments.length > 0 ? (
                    event.comments.map((comment) => (
                      <div key={comment._id} className="p-4 bg-card border border-border rounded-lg">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                            <User className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div className="flex-grow">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold">{comment.user?.name || 'Anonymous'}</p>
                              {comment.user?.role && <Badge variant="outline" className="capitalize text-xs">{comment.user.role}</Badge>}
                            </div>
                            <p className="text-sm text-muted-foreground">{formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}</p>
                            <p className="mt-2">{comment.text}</p>
                          </div>
                        </div>
                        <div className="pl-12 mt-4 space-y-4">
                          {comment.replies?.map((reply) => (
                            <div key={reply._id} className="flex items-start gap-3">
                              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <User className="h-4 w-4 text-primary" />
                              </div>
                              <div className="flex-grow">
                                <div className="flex items-center gap-2">
                                  <p className="font-semibold">{reply.user?.name || 'Anonymous'}</p>
                                  {reply.user?.role && <Badge variant="secondary" className="capitalize text-xs">{reply.user.role}</Badge>}
                                </div>
                                <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}</p>
                                <p className="mt-1 text-sm">{reply.text}</p>
                              </div>
                            </div>
                          ))}
                          {isAuthenticated && (
                            <div className="flex items-center gap-2 pt-2">
                              <input
                                placeholder="Write a reply..."
                                value={replyingTo?.commentId === comment._id ? replyingTo.text : ''}
                                onChange={(e) => setReplyingTo({ commentId: comment._id, text: e.target.value })}
                                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                              />
                              <Button size="icon" variant="ghost" onClick={() => replyingTo && replyMutation.mutate({ commentId: replyingTo.commentId, text: replyingTo.text })} disabled={replyMutation.isPending}>
                                <Send className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground py-4">No comments yet. Be the first to say something!</p>
                  )}
                </div>
              </Card>

            </div>

            <div className="space-y-4">
              <Card className="p-6 space-y-4 sticky top-24">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Capacity</p>
                    <p className="text-2xl font-bold text-foreground">{event.totalCapacity - spotsAvailable}/{event.totalCapacity}</p>
                    <p className="text-xs text-muted-foreground mt-1">{spotsAvailable} spots available</p>
                  </div>

                  {event.requiresFee && (
                    <div className="pt-4 border-t border-border">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="w-4 h-4 text-accent" />
                        <span className="text-sm text-muted-foreground">Fee Required</span>
                      </div>
                      <p className="text-2xl font-bold text-foreground">₹{event.feeAmount || 0}</p>
                    </div>
                  )}

                  {isAuthenticated ? (
                    <>
                      {isRegistered ? (
                        <Button variant="destructive" className="w-full" onClick={() => unregisterMutation.mutate()} disabled={unregisterMutation.isPending}>
                          {unregisterMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Unregistering...</> : 'Unregister'}
                        </Button>
                      ) : (
                        <Button className="w-full" onClick={() => registrationMutation.mutate()} disabled={registrationMutation.isPending || spotsAvailable === 0}>
                          {registrationMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Registering...</> : spotsAvailable === 0 ? 'Event Full' : 'Register Now'}
                        </Button>
                      )}
                    </>
                  ) : (
                    <Button className="w-full" onClick={() => navigate('/login')}>Sign In to Register</Button>
                  )}

                  {event.registrationLink && (
                    <Button variant="outline" className="w-full" asChild>
                      <a href={event.registrationLink} target="_blank" rel="noopener noreferrer">External Registration</a>
                    </Button>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
