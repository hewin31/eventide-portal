import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { Sidebar } from '@/components/Sidebar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, FileText, Users, QrCode, CheckSquare } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { API_BASE_URL } from '@/lib/utils';

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
  const [showQRScanner, setShowQRScanner] = useState(false);

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
                      {registrationData?.registeredStudents?.map((student: any) => (
                        <TableRow key={student._id}>
                          <TableCell className="font-medium">{student.name}</TableCell>
                          <TableCell>{student.email}</TableCell>
                          <TableCell>{new Date(student.createdAt).toLocaleDateString()}</TableCell>
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
                    <Button onClick={() => setShowQRScanner(!showQRScanner)}>
                      <QrCode className="mr-2 h-4 w-4" />
                      {showQRScanner ? 'Close Scanner' : 'Scan QR Code'}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {showQRScanner && (
                    <div className="mb-6 p-8 border-2 border-dashed border-border rounded-lg text-center bg-muted/50">
                      <QrCode className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">QR Scanner will be activated here</p>
                      <p className="text-sm text-muted-foreground mt-2">Camera permissions required</p>
                    </div>
                  )}
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
                          <TableCell>{att.timestamp ? new Date(att.timestamp).toLocaleTimeString() : '-'}</TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm">
                              Toggle
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
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
                      {registrationData?.attendance?.filter((att: any) => att.odStatus).map((req: any) => (
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
                                  <Button size="sm" variant="default">Approve</Button>
                                  <Button size="sm" variant="destructive">Reject</Button>
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
        </div>
      </main>
    </div>
  );
};

export default EventManagement;
