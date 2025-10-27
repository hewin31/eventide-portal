import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { Sidebar } from '@/components/Sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/lib/utils';
import { Check, X, Loader2, User, Calendar as CalendarIcon } from 'lucide-react';

interface ODRequest {
  _id: string; // Attendance record ID
  student: {
    _id: string;
    name: string;
    email: string;
  };
  event: {
    _id: string;
    name: string;
    club: {
      _id: string;
      name: string;
    };
    startDateTime: string;
  };
  odStatus: 'pending' | 'approved' | 'rejected' | 'not_applicable';
}

async function fetchPendingODRequests(token: string | null): Promise<ODRequest[]> {
  if (!token) throw new Error('Not authenticated');
  const res = await fetch(`${API_BASE_URL}/api/attendance/od-requests`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || 'Failed to fetch OD requests');
  }
  return res.json();
}

async function updateODStatus({ attendanceId, odStatus, token }: { attendanceId: string; odStatus: 'approved' | 'rejected'; token: string | null }) {
  if (!token) throw new Error('Not authenticated');
  const res = await fetch(`${API_BASE_URL}/api/attendance/${attendanceId}/od`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ odStatus }),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || `Failed to ${odStatus} OD request`);
  }
  return res.json();
}

const ODManagementPage: React.FC = () => {
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

  const { data: odRequests, isLoading, error } = useQuery<ODRequest[], Error>({
    queryKey: ['pendingODRequests'],
    queryFn: () => fetchPendingODRequests(token),
    enabled: !!token && user?.role === 'coordinator',
  });

  const approveRejectODMutation = useMutation({
    mutationFn: (variables: { attendanceId: string; odStatus: 'approved' | 'rejected' }) => updateODStatus({ ...variables, token }),
    onSuccess: (data, variables) => {
      toast.success(`OD request ${variables.odStatus} successfully!`);
      queryClient.invalidateQueries({ queryKey: ['pendingODRequests'] });
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
          <p className="ml-2">Loading OD requests...</p>
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
            OD Management
          </h1>
          <p className="text-muted-foreground mb-8">Review and approve On-Duty requests from students for events in your clubs.</p>

          <Card>
            <CardHeader>
              <CardTitle>Pending OD Requests ({odRequests?.length || 0})</CardTitle>
              <CardDescription>Requests for On-Duty status awaiting your approval.</CardDescription>
            </CardHeader>
            <CardContent>
              {error && <p className="text-destructive text-center py-4">{error.message}</p>}
              {!isLoading && odRequests && odRequests.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student Name</TableHead>
                      <TableHead>Event Name</TableHead>
                      <TableHead>Club</TableHead>
                      <TableHead>Event Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {odRequests.map((req) => (
                      <TableRow key={req._id}>
                        <TableCell className="font-medium flex items-center gap-1">
                          <User className="h-3 w-3" /> {req.student.name}
                        </TableCell>
                        <TableCell>
                          <Link to={`/club/${req.event.club._id}/event/${req.event._id}`} className="hover:underline text-primary">
                            {req.event.name}
                          </Link>
                        </TableCell>
                        <TableCell>{req.event.club.name}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <CalendarIcon className="h-3 w-3" />
                            {new Date(req.event.startDateTime).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{req.odStatus}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => approveRejectODMutation.mutate({ attendanceId: req._id, odStatus: 'approved' })}
                              disabled={approveRejectODMutation.isPending}
                            >
                              <Check className="h-4 w-4 mr-1" /> Approve
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => approveRejectODMutation.mutate({ attendanceId: req._id, odStatus: 'rejected' })}
                              disabled={approveRejectODMutation.isPending}
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
                <p className="text-center text-muted-foreground py-4">No pending OD requests.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default ODManagementPage;