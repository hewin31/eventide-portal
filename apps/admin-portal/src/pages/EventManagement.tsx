import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { Sidebar } from '@/components/Sidebar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'; // This was not used
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, FileText, Users, QrCode, CheckSquare, Eye, Heart } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/lib/utils';
import { QRCodeModal } from '@/components/QRCodeModal';

async function fetchEventDetails(eventId: string, token: string | null) {
  if (!token) throw new Error('Not authenticated');
  const res = await fetch(`${API_BASE_URL}/api/events/${eventId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to fetch event details');
  return res.json();
}

async function fetchEventRegistrations(eventId: string, token: string | null) {
  if (!token) throw new Error('Not authenticated');
  const res = await fetch(`${API_BASE_URL}/api/events/${eventId}/registrations`, {
    headers: { 
      'Authorization': `Bearer ${token}` 
    }
  });
  if (!res.ok) throw new Error('Failed to fetch registration data');
  return res.json();
}

const EventManagement = () => {
  const { clubId, eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const token = localStorage.getItem('token');
  const [activeTab, setActiveTab] = useState('details');
  const queryClient = useQueryClient();
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  const isCoordinator = user?.role === 'coordinator';

  const { data: event, isLoading: isLoadingEvent } = useQuery({
    queryKey: ['event', eventId],
    queryFn: () => fetchEventDetails(eventId!, token),
    enabled: !!eventId && !!token,
  });

  const { data: registrationData, isLoading: isLoadingRegistrations } = useQuery({
    queryKey: ['eventRegistrations', eventId],
    queryFn: () => fetchEventRegistrations(eventId!, token),
    enabled: !!eventId && !!token,
  });

  const toggleAttendanceMutation = useMutation({
    mutationFn: (attendanceId: string) => {
      return fetch(`${API_BASE_URL}/api/attendance/${attendanceId}/toggle`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
    },
    onSuccess: async () => {
      toast.success('Attendance status updated.');
      await queryClient.invalidateQueries({ queryKey: ['eventRegistrations', eventId] });
    },
    onError: () => {
      toast.error('Failed to update attendance.');
    },
  });

  const handleToggleAttendance = (attendanceId: string) => {
    toggleAttendanceMutation.mutate(attendanceId);
  };

  const updateOdStatusMutation = useMutation({
    mutationFn: ({ attendanceId, odStatus }: { attendanceId: string; odStatus: 'approved' | 'rejected' }) => {
      return fetch(`${API_BASE_URL}/api/attendance/${attendanceId}/od`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ odStatus }),
      });
    },
    onSuccess: async () => {
      toast.success('OD status updated successfully.');
      await queryClient.invalidateQueries({ queryKey: ['eventRegistrations', eventId] });
    },
    onError: () => {
      toast.error('Failed to update OD status.');
    },
  });

  const handleOdApproval = (attendanceId: string, status: 'approved' | 'rejected') => {
    updateOdStatusMutation.mutate({ attendanceId, odStatus: status });
  };

  if (isLoadingEvent) {
    return <div className="flex min-h-screen items-center justify-center">Loading Event...</div>;
  }

  if (!event) {
    return <div className="flex min-h-screen items-center justify-center">Event not found.</div>;
  }

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <Button variant="ghost" onClick={() => navigate(`/club/${clubId}`)} className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Club
            </Button>
            <h1 className="text-4xl font-bold mb-2">{event.name}</h1>
            <p className="text-muted-foreground">
              {new Date(event.startDateTime).toLocaleDateString()} • {new Date(event.startDateTime).toLocaleTimeString()}
            </p>
            <div className="mt-4 flex items-center space-x-6 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <Eye className="h-5 w-5" />
                <span>{event.viewsCount || 0} Views</span>
              </div>
              <div className="flex items-center space-x-2">
                <Heart className="h-5 w-5" />
                <span>{event.likesCount || 0} Likes</span>
              </div>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full max-w-2xl grid-cols-4">
              <TabsTrigger value="details">
                <FileText className="mr-2 h-4 w-4" />
                Details
              </TabsTrigger>
              <TabsTrigger value="registered">
                <Users className="mr-2 h-4 w-4" />
                Registered
              </TabsTrigger>
              <TabsTrigger value="attendance">
                <QrCode className="mr-2 h-4 w-4" />
                Attendance
              </TabsTrigger>
              <TabsTrigger value="od">
                <CheckSquare className="mr-2 h-4 w-4" />
                OD Approvals
              </TabsTrigger>
            </TabsList>

            <TabsContent value="details">
              <Card>
                <CardHeader>
                  <CardTitle>Event Details</CardTitle>
                  <CardDescription>View and manage event information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold">Event Name</label>
                      <p className="text-muted-foreground">{event.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-semibold">Status</label>
                      <div className="mt-1">
                        <Badge className="capitalize">{event.status}</Badge>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-semibold">Date</label>
                      <p className="text-muted-foreground">{new Date(event.startDateTime).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <label className="text-sm font-semibold">Time</label>
                      <p className="text-muted-foreground">{new Date(event.startDateTime).toLocaleTimeString()}</p>
                    </div>
                    <div className="col-span-2">
                      <label className="text-sm font-semibold">Venue</label>
                      <p className="text-muted-foreground">{event.venue}</p>
                    </div>
                    <div className="col-span-2">
                      <label className="text-sm font-semibold">Description</label>
                      <p className="text-muted-foreground">{event.description}</p>
                    </div>
                  </div>
                  {user?.role === 'member' && (
                    <Button onClick={() => navigate(`/club/${clubId}/event/${eventId}/edit`)}>Edit Details</Button>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="registered">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Registered Participants</CardTitle>
                      <CardDescription>{registrationData?.registeredStudents?.length || 0} participants registered</CardDescription>
                    </div>
                    <Button variant="outline">Export List</Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Registered At</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoadingRegistrations && <TableRow><TableCell colSpan={3}>Loading...</TableCell></TableRow>}
                      {registrationData?.attendance?.map((att: any) => (
                        <TableRow key={att._id}>
                          <TableCell className="font-medium">{att.student.name}</TableCell>
                          <TableCell>{att.student.email}</TableCell>
                          <TableCell>{new Date(att.createdAt).toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="attendance">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Attendance Management</CardTitle>
                      <CardDescription>Mark and track event attendance</CardDescription>
                    </div>
                    {event.checkInQRCode ? (
                      <Button onClick={() => setIsQrModalOpen(true)}>
                        <QrCode className="mr-2 h-4 w-4" />
                        Show Check-in QR
                      </Button>
                    ) : (
                      <Button variant="outline" disabled>
                        <QrCode className="mr-2 h-4 w-4" />
                        QR Not Generated
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-6">Display the QR code on a screen for students to scan with the Eventide mobile app to mark their attendance.</p>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Marked At</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoadingRegistrations && <TableRow><TableCell colSpan={4}>Loading...</TableCell></TableRow>}
                      {registrationData?.attendance?.map((att: any) => (
                        <TableRow key={att._id}>
                          <TableCell className="font-medium">{att.student.name}</TableCell>
                          <TableCell>
                            <Badge variant={att.present ? 'default' : 'secondary'}>
                              {att.present ? 'Present' : 'Absent'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {att.createdAt !== att.updatedAt ? new Date(att.updatedAt).toLocaleString() : '-'}
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleToggleAttendance(att._id)}
                              disabled={toggleAttendanceMutation.isPending}
                            >
                              Toggle
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {!isLoadingRegistrations && registrationData?.attendance?.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground">No students registered for this event yet.</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="od">
              <Card>
                <CardHeader>
                  <CardTitle>OD Approval Requests</CardTitle>
                  <CardDescription>
                    {isCoordinator 
                      ? 'Review and approve on-duty requests for this event' 
                      : 'View OD request statuses'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Status</TableHead>
                        {isCoordinator && <TableHead>Actions</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoadingRegistrations && <TableRow><TableCell colSpan={isCoordinator ? 4 : 3}>Loading...</TableCell></TableRow>}
                      {registrationData?.attendance?.filter((att: any) => att.odStatus !== 'not_applicable').map((req: any) => (
                        <TableRow key={req._id}>
                          <TableCell className="font-medium">{req.student.name}</TableCell>
                          <TableCell>Participated in event</TableCell>
                          <TableCell>
                            <Badge 
                              variant={
                                req.odStatus === 'approved' ? 'default' : 
                                req.odStatus === 'rejected' ? 'destructive' : 
                                'secondary'
                              }
                            >
                              {req.odStatus}
                            </Badge>
                          </TableCell>
                          {isCoordinator && (
                            <TableCell>
                              {req.odStatus === 'pending' && (
                                <div className="flex gap-2">
                                  <Button 
                                    size="sm" 
                                    variant="default"
                                    onClick={() => handleOdApproval(req._id, 'approved')}
                                    disabled={updateOdStatusMutation.isPending}
                                  >
                                    Approve
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="destructive"
                                    onClick={() => handleOdApproval(req._id, 'rejected')}
                                    disabled={updateOdStatusMutation.isPending}
                                  >
                                    Reject
                                  </Button>
                                </div>
                              )}
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

          </Tabs>

          {isQrModalOpen && (
            <QRCodeModal
              eventName={event.name}
              qrCodeDataUrl={event.checkInQRCode}
              onClose={() => setIsQrModalOpen(false)}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default EventManagement;
