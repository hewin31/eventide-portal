import { useQuery } from '@tanstack/react-query';
import { SignInRequired } from '@/components/auth/SignInRequired';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileCheck, Clock, CheckCircle2, XCircle, AlertTriangle, FileText } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const API_BASE_URL = 'http://localhost:5000/api';

interface ODRequest {
  _id: string;
  event: {
    _id: string;
    name: string;
    startDateTime: string;
  };
  odStatus: 'pending' | 'approved' | 'rejected' | 'not_applicable';
  checkInTime: string; // Using this as the submission timestamp
}

async function fetchMyODRequests(token: string | null): Promise<ODRequest[]> {
  if (!token) throw new Error('Not authenticated');
  const res = await fetch(`${API_BASE_URL}/attendance/my-od-requests`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error('Failed to fetch your OD requests.');
  }
  return res.json();
}

export const ODApprovals = () => {
  const { isAuthenticated, token, user } = useAuth();

  const { data: approvals, isLoading, error } = useQuery({
    queryKey: ['myODRequests'],
    queryFn: () => fetchMyODRequests(token),
    enabled: isAuthenticated,
  });

  const getStatusBadge = (status?: 'pending' | 'approved' | 'rejected' | 'not_applicable') => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="flex items-center gap-1">
          <Clock className="w-3 h-3" /> Pending
        </Badge>;
      case 'approved':
        return <Badge className="flex items-center gap-1 bg-green-500 hover:bg-green-600">
          <CheckCircle2 className="w-3 h-3" /> Approved
        </Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="flex items-center gap-1">
          <XCircle className="w-3 h-3" /> Rejected
        </Badge>;
      default:
        return <Badge variant="outline" className="flex items-center gap-1 border-dashed">
          Status Unknown
        </Badge>;
    }
  };

  const handleDownloadCertificate = async (attendanceId: string, eventName: string) => {
    if (!token) {
      toast.error('Authentication error. Please sign in again.');
      return;
    }

    const toastId = toast.loading('Generating your certificate...');

    try {
      const response = await fetch(`${API_BASE_URL}/attendance/${attendanceId}/od-certificate`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to download certificate.');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `OD_Certificate_${eventName.replace(/\s/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      toast.success('Certificate downloaded!', { id: toastId });
    } catch (err: any) {
      toast.error(err.message || 'An error occurred.', { id: toastId });
    }
  };

  if (!isAuthenticated) {
    return (
      <SignInRequired description="Sign in to track your OD requests and approvals." />
    );
  }

  return (
    <div className="min-h-screen pb-20 md:pb-8 px-6 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan to-primary flex items-center justify-center">
            <FileCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">OD Approvals</h1>
            {!isLoading && !error && (
              <p className="text-muted-foreground">
                {approvals?.length || 0} request{approvals?.length !== 1 ? 's' : ''} found
              </p>
            )}
          </div>
        </div>

        {(() => {
          if (isLoading) {
            return (
              <div className="space-y-4">
                {Array.from({ length: 2 }).map((_, i) => (
                  <Card key={i}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <Skeleton className="h-6 w-48 mb-2" />
                          <Skeleton className="h-4 w-32" />
                        </div>
                        <Skeleton className="h-6 w-24" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-4 w-40" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            );
          }

          if (error) {
            return (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error Loading Requests</AlertTitle>
                <AlertDescription>{error.message}</AlertDescription>
              </Alert>
            );
          }

          if (approvals && approvals.length > 0) {
            return (
              <div className="space-y-4">
                {approvals.map((approval) => (
                  <Card key={approval._id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-xl">{approval.event?.name ?? 'Event Not Found'}</CardTitle>
                          <CardDescription>
                            Event Date: {approval.event ? new Date(approval.event.startDateTime).toLocaleDateString('en-US', { dateStyle: 'medium' }) : 'N/A'}
                          </CardDescription>
                        </div>
                        {getStatusBadge(approval.odStatus)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Submitted on: {approval.checkInTime
                          ? new Date(approval.checkInTime).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
                          : 'Not yet submitted'}
                      </p>
                    </CardContent>
                    {approval.odStatus === 'approved' && (
                      <CardFooter>
                        <Button onClick={() => handleDownloadCertificate(approval._id, approval.event.name)}>
                          <FileText className="w-4 h-4 mr-2" />
                          Download OD Certificate
                        </Button>
                      </CardFooter>
                    )}
                  </Card>
                ))}
              </div>
            );
          }

          return (
            <div className="text-center py-16 bg-muted/30 rounded-2xl">
              <FileCheck className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No OD requests</h3>
              <p className="text-muted-foreground">
                Your OD requests will appear here after you attend events.
              </p>
            </div>
          );
        })()}
      </div>
    </div>
  );
};
