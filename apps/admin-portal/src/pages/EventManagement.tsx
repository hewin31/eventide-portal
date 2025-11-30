import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { Sidebar } from '@/components/Sidebar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'; // This was not used
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { ArrowLeft, FileText, Users, QrCode, CheckSquare, Eye, Heart, MessageSquare, Send, User, Trash2, Pencil } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
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
  const [deleteCommentCandidate, setDeleteCommentCandidate] = useState<{ commentId: string; text: string } | null>(null);
  const [deleteReplyCandidate, setDeleteReplyCandidate] = useState<{ commentId: string; replyId: string; text: string } | null>(null);
  const [replyingTo, setReplyingTo] = useState<{ commentId: string; text: string } | null>(null);
  const [editingComment, setEditingComment] = useState<{ id: string; text: string } | null>(null);
  const [newComment, setNewComment] = useState('');
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

  const replyMutation = useMutation({
    mutationFn: ({ commentId, text }: { commentId: string; text: string }) => {
      return fetch(`${API_BASE_URL}/api/events/${eventId}/comments/${commentId}/replies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ text }),
      });
    },
    onSuccess: async () => {
      toast.success('Reply posted successfully.');
      await queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      setReplyingTo(null); // Clear reply input
    },
    onError: () => {
      toast.error('Failed to post reply.');
    },
  });

  const handlePostReply = (commentId: string) => {
    if (!replyingTo || replyingTo.text.trim() === '') return;
    replyMutation.mutate({ commentId, text: replyingTo.text });
  };

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: string) => {
      return fetch(`${API_BASE_URL}/api/events/${eventId}/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
    },
    onSuccess: async () => {
      toast.success('Comment deleted successfully.');
      await queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      setDeleteCommentCandidate(null);
    },
    onError: (error) => {
      toast.error(`Failed to delete comment: ${error.message}`);
    },
  });

  const deleteReplyMutation = useMutation({
    mutationFn: ({ commentId, replyId }: { commentId: string; replyId: string }) => {
      return fetch(`${API_BASE_URL}/api/events/${eventId}/comments/${commentId}/replies/${replyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
    },
    onSuccess: async () => {
      toast.success('Reply deleted successfully.');
      await queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      setDeleteReplyCandidate(null);
    },
    onError: (error) => {
      toast.error(`Failed to delete reply: ${error.message}`);
    },
  });

  const editCommentMutation = useMutation({
    mutationFn: ({ commentId, text }: { commentId: string; text: string }) => {
      return fetch(`${API_BASE_URL}/api/events/${eventId}/comments/${commentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ text }),
      });
    },
    onSuccess: async () => {
      toast.success('Comment updated successfully.');
      await queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      setEditingComment(null); // Exit editing mode
    },
    onError: (error) => {
      toast.error(`Failed to update comment: ${error.message}`);
    },
  });

  const handleUpdateComment = () => {
    if (!editingComment || editingComment.text.trim() === '') return;
    editCommentMutation.mutate({ commentId: editingComment.id, text: editingComment.text });
  };

  const commentMutation = useMutation({
    mutationFn: (text: string) => {
      return fetch(`${API_BASE_URL}/api/events/${eventId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ text }),
      });
    },
    onSuccess: async () => {
      toast.success('Comment posted successfully.');
      await queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      setNewComment(''); // Clear input after posting
    },
    onError: () => {
      toast.error('Failed to post comment.');
    },
  });

  const handlePostComment = () => {
    if (newComment.trim() === '') return;
    commentMutation.mutate(newComment);
  };

  const handleExportList = () => {
    if (!registrationData || !registrationData.attendance || registrationData.attendance.length === 0) {
      toast.info("No registered participants to export.");
      return;
    }

    const headers = ["Name", "Email", "Registered At"];
    const csvRows = registrationData.attendance.map((att: any) => {
      const name = `"${att.student.name.replace(/"/g, '""')}"`; // Escape double quotes
      const email = `"${att.student.email.replace(/"/g, '""')}"`;
      const registeredAt = `"${new Date(att.createdAt).toLocaleString().replace(/"/g, '""')}"`;
      return [name, email, registeredAt].join(',');
    });

    const csvContent = [headers.join(','), ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `${event.name}_registrations.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Exported registered participants list.");
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
            <TabsList className="grid w-full max-w-3xl grid-cols-5">
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
              <TabsTrigger value="comments">
                <MessageSquare className="mr-2 h-4 w-4" />
                Comments
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
                    <Button variant="outline" onClick={handleExportList}>Export List</Button>
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

            <TabsContent value="comments">
              <Card>
                <CardHeader>
                  <CardTitle>Event Comments</CardTitle>
                  <CardDescription>
                    View and participate in the discussion. All users can post comments and replies.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* New Comment Input */}
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Write a comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                    />
                    <Button onClick={handlePostComment} disabled={commentMutation.isPending}>
                      <Send className="mr-2 h-4 w-4" /> Post
                    </Button>
                  </div>
                  {event.comments && event.comments.length > 0 ? (
                    event.comments.map((comment: any) => (
                      <div key={comment._id} className="p-4 border rounded-lg">
                        <div className="relative flex items-start gap-3">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                            <User className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div className="flex-grow">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold">{comment.user?.name || 'Anonymous'}</p>
                              <Badge variant="outline" className="capitalize text-xs">{comment.user?.role}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}</p>
                            
                            {editingComment?.id === comment._id ? (
                              <div className="mt-2 space-y-2">
                                <Input
                                  value={editingComment.text}
                                  onChange={(e) => setEditingComment({ ...editingComment, text: e.target.value })}
                                  autoFocus
                                />
                                <div className="flex gap-2">
                                  <Button size="sm" onClick={handleUpdateComment} disabled={editCommentMutation.isPending}>Save</Button>
                                  <Button size="sm" variant="ghost" onClick={() => setEditingComment(null)}>Cancel</Button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="absolute top-2 right-2 flex items-center">
                                  {user?.id === comment.user?._id && (
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => setEditingComment({ id: comment._id, text: comment.text })}>
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                  )}
                                  {(user?.role === 'member' || user?.role === 'coordinator' || user?.id === comment.user?._id) && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                      onClick={() => setDeleteCommentCandidate({ commentId: comment._id, text: comment.text })}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                                <p className="mt-2">{comment.text}</p>
                              </>
                            )}
                          </div>
                        </div>
                        {/* Replies Section */}
                        <div className="pl-12 mt-4 space-y-4">
                          {comment.replies?.map((reply: any) => (
                            <div key={reply._id} className="relative flex items-start gap-3">
                              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <User className="h-4 w-4 text-primary" />
                              </div>
                              <div className="flex-grow">
                                <div className="flex items-center gap-2">
                                  <p className="font-semibold">{reply.user?.name || 'Coordinator'}</p>
                                  <Badge variant="secondary" className="capitalize text-xs">{reply.user?.role}</Badge>
                                </div>
                                <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}</p>
                                <p className="mt-1 text-sm">{reply.text}</p>
                                {(user?.role === 'member' || user?.role === 'coordinator' || user?.id === reply.user?._id) && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="absolute top-0 right-0 text-muted-foreground hover:text-destructive"
                                    onClick={() => setDeleteReplyCandidate({ commentId: comment._id, replyId: reply._id, text: reply.text })}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                          {/* Reply Input for all authenticated users */}
                          <div className="flex items-center gap-2 pt-2">
                            <Input
                              placeholder="Write a reply..."
                              value={replyingTo?.commentId === comment._id ? replyingTo.text : ''}
                              onChange={(e) => setReplyingTo({ commentId: comment._id, text: e.target.value })}
                            />
                            <Button size="icon" onClick={() => handlePostReply(comment._id)} disabled={replyMutation.isPending}>
                              <Send className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground py-8">No comments on this event yet.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <AlertDialog open={!!deleteCommentCandidate} onOpenChange={() => setDeleteCommentCandidate(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the comment: "<strong>{deleteCommentCandidate?.text}</strong>".
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteCommentCandidate && deleteCommentMutation.mutate(deleteCommentCandidate.commentId)}
                  disabled={deleteCommentMutation.isPending}
                >
                  {deleteCommentMutation.isPending ? 'Deleting...' : 'Delete Comment'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog open={!!deleteReplyCandidate} onOpenChange={() => setDeleteReplyCandidate(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure you want to delete this reply?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the reply: "<strong>{deleteReplyCandidate?.text}</strong>".
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteReplyCandidate && deleteReplyMutation.mutate({ commentId: deleteReplyCandidate.commentId, replyId: deleteReplyCandidate.replyId })}
                  disabled={deleteReplyMutation.isPending}
                >
                  {deleteReplyMutation.isPending ? 'Deleting...' : 'Delete Reply'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
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
