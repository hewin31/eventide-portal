import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Sidebar } from '@/components/Sidebar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, FileText, Users, QrCode, CheckSquare } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

// Mock data
const mockEventDetails = {
  id: 'e1',
  name: 'Annual Music Concert',
  date: '2025-11-15',
  time: '18:00',
  venue: 'Main Auditorium',
  description: 'Annual music concert featuring performances from club members',
  status: 'upcoming',
};

const mockRegistrations = [
  { id: '1', name: 'John Doe', email: 'john@college.edu', registeredAt: '2025-10-01' },
  { id: '2', name: 'Jane Smith', email: 'jane@college.edu', registeredAt: '2025-10-02' },
  { id: '3', name: 'Mike Johnson', email: 'mike@college.edu', registeredAt: '2025-10-03' },
];

const mockAttendance = [
  { id: '1', name: 'John Doe', status: 'present', markedAt: '2025-11-15 18:05' },
  { id: '2', name: 'Jane Smith', status: 'present', markedAt: '2025-11-15 18:03' },
  { id: '3', name: 'Mike Johnson', status: 'absent', markedAt: null },
];

const mockODRequests = [
  { id: '1', name: 'John Doe', reason: 'Participating in event', status: 'pending' },
  { id: '2', name: 'Jane Smith', reason: 'Event volunteer', status: 'approved' },
];

const EventManagement = () => {
  const { clubId, eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('details');
  const [showQRScanner, setShowQRScanner] = useState(false);

  const isCoordinator = user?.role === 'coordinator';

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
            <h1 className="text-4xl font-bold mb-2">{mockEventDetails.name}</h1>
            <p className="text-muted-foreground">
              {new Date(mockEventDetails.date).toLocaleDateString()} • {mockEventDetails.time}
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
                      <p className="text-muted-foreground">{mockEventDetails.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-semibold">Status</label>
                      <div className="mt-1">
                        <Badge>{mockEventDetails.status}</Badge>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-semibold">Date</label>
                      <p className="text-muted-foreground">{mockEventDetails.date}</p>
                    </div>
                    <div>
                      <label className="text-sm font-semibold">Time</label>
                      <p className="text-muted-foreground">{mockEventDetails.time}</p>
                    </div>
                    <div className="col-span-2">
                      <label className="text-sm font-semibold">Venue</label>
                      <p className="text-muted-foreground">{mockEventDetails.venue}</p>
                    </div>
                    <div className="col-span-2">
                      <label className="text-sm font-semibold">Description</label>
                      <p className="text-muted-foreground">{mockEventDetails.description}</p>
                    </div>
                  </div>
                  <Button>Edit Details</Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="registered">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Registered Participants</CardTitle>
                      <CardDescription>{mockRegistrations.length} participants registered</CardDescription>
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
                      {mockRegistrations.map((reg) => (
                        <TableRow key={reg.id}>
                          <TableCell className="font-medium">{reg.name}</TableCell>
                          <TableCell>{reg.email}</TableCell>
                          <TableCell>{reg.registeredAt}</TableCell>
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
                      {mockAttendance.map((att) => (
                        <TableRow key={att.id}>
                          <TableCell className="font-medium">{att.name}</TableCell>
                          <TableCell>
                            <Badge variant={att.status === 'present' ? 'default' : 'secondary'}>
                              {att.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{att.markedAt || '-'}</TableCell>
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
                      {mockODRequests.map((req) => (
                        <TableRow key={req.id}>
                          <TableCell className="font-medium">{req.name}</TableCell>
                          <TableCell>{req.reason}</TableCell>
                          <TableCell>
                            <Badge 
                              variant={
                                req.status === 'approved' ? 'default' : 
                                req.status === 'rejected' ? 'destructive' : 
                                'secondary'
                              }
                            >
                              {req.status}
                            </Badge>
                          </TableCell>
                          {isCoordinator && (
                            <TableCell>
                              {req.status === 'pending' && (
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
