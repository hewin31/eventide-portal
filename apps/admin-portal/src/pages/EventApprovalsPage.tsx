import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { Sidebar } from '@/components/Sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/lib/utils';
import { Check, X, Loader2, Calendar as CalendarIcon, MapPin } from 'lucide-react';

interface EventToApprove {
  _id: string;
  name: string;
  club: {
    _id: string;
    name: string;
  };
  status: 'pending' | 'approved' | 'rejected';
  startDateTime: string;
  venue: string;
  mode: 'online' | 'offline' | 'hybrid';
}

async function fetchPendingEvents(token: string | null): Promise<EventToApprove[]> {
  if (!token) throw new Error('Not authenticated');
  const res = await fetch(`${API_BASE_URL}/api/events/pending-approvals`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || 'Failed to fetch pending events');
  }
  return res.json();
}

async function updateEventStatus({ eventId, status, token }: { eventId: string; status: 'approved' | 'rejected'; token: string | null }) {
  if (!token) throw new Error('Not authenticated');
  const res = await fetch(`${API_BASE_URL}/api/events/${eventId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || `Failed to ${status} event`);
  }
  return res.json();
}

const EventApprovalsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const queryClient = useQueryClient();

  React.useEffect(() => {
    if (user && user.role !== 'coordinator') {
      navigate('/dashboard');
      toast.error("Access Denied", { description: "You do not have permission to view this page." });
    }
  }, [user, navigate]);

  const { data: pendingEvents, isLoading, error } = useQuery<EventToApprove[], Error>({
    queryKey: ['pendingEvents'],
    queryFn: () => fetchPendingEvents(token),
    enabled: !!token && user?.role === 'coordinator',
  });

  const approveRejectMutation = useMutation({
    mutationFn: (variables: { eventId: string; status: 'approved' | 'rejected' }) => updateEventStatus({ ...variables, token }),
    onSuccess: (data, variables) => {
      toast.success(`Event ${variables.status} successfully!`);
      queryClient.invalidateQueries({ queryKey: ['pendingEvents'] });
      queryClient.invalidateQueries({ queryKey: ['events', data.club] });
    },
    onError: (err: Error) => {
      toast.error("Action Failed", { description: err.message });
    },
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar />
        <main className="flex-1 p-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="ml-2">Loading pending events...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-6 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            Event Approvals
          </h1>
          <p className="text-muted-foreground mb-8">Review and manage events submitted by club members for the clubs you coordinate.</p>

          <Card>
            <CardHeader>
              <CardTitle>Pending Events ({pendingEvents?.length || 0})</CardTitle>
              <CardDescription>Events awaiting your approval.</CardDescription>
            </CardHeader>
            <CardContent>
              {error && <p className="text-destructive text-center py-4">{error.message}</p>}
              {!isLoading && pendingEvents && pendingEvents.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event Name</TableHead>
                      <TableHead>Club</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Venue/Mode</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingEvents.map((event) => (
                      <TableRow key={event._id}>
                        <TableCell className="font-medium">
                          <Link to={`/club/${event.club._id}/event/${event._id}`} className="hover:underline text-primary">
                            {event.name}
                          </Link>
                        </TableCell>
                        <TableCell>{event.club.name}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <CalendarIcon className="h-3 w-3" />
                            {new Date(event.startDateTime).toLocaleString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <MapPin className="h-3 w-3" />
                            {event.venue} ({event.mode})
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{event.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => approveRejectMutation.mutate({ eventId: event._id, status: 'approved' })}
                              disabled={approveRejectMutation.isPending}
                            >
                              <Check className="h-4 w-4 mr-1" /> Approve
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => approveRejectMutation.mutate({ eventId: event._id, status: 'rejected' })}
                              disabled={approveRejectMutation.isPending}
                            >
                              <X className="h-4 w-4 mr-1" /> Reject
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-muted-foreground py-4">No pending event approvals.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default EventApprovalsPage;