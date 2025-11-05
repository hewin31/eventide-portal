import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { Sidebar } from '@/components/Sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { API_BASE_URL } from '@/lib/utils';
import { format } from 'date-fns';
import { Megaphone, Calendar } from 'lucide-react';

interface Announcement {
  _id: string;
  message: string;
  createdAt: string;
  expiryDate?: string;
}

async function fetchAnnouncements(token: string | null): Promise<Announcement[]> {
  const res = await fetch(`${API_BASE_URL}/api/announcements`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch announcements');
  return res.json();
}

const AnnouncementsPage = () => {
  const { user } = useAuth();
  const token = localStorage.getItem('token');
  const { data: announcements, isLoading, error } = useQuery<Announcement[]>({
    queryKey: ['announcements'],
    queryFn: () => fetchAnnouncements(token),
  });

  useEffect(() => {
    if (user && announcements && announcements.length > 0) {
      // When the user visits this page, mark all current announcements as "read"
      // by storing the timestamp of the newest announcement for this specific user.
      const latestTimestamp = new Date(announcements[0].createdAt).getTime();
      const userReadTimestampKey = `lastReadAnnouncementTimestamp_${user.id}`;
      localStorage.setItem(userReadTimestampKey, latestTimestamp.toString());
    }
  }, [announcements, user]);

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Announcements</h1>
            <p className="text-muted-foreground">Latest updates and news from the college administration.</p>
          </div>

          {isLoading && <p>Loading announcements...</p>}
          {error && <p className="text-red-500">Error loading announcements.</p>}

          <div className="space-y-6">
            {announcements?.map((ann) => (
              <Card key={ann._id} className="overflow-hidden">
                <CardHeader className="bg-muted/50 flex flex-row items-start gap-4 space-y-0 p-6">
                  <div className="bg-primary/10 p-3 rounded-full">
                    <Megaphone className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-xl">{ann.message}</CardTitle>
                    <CardDescription className="mt-2 flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4" />
                      Posted on {format(new Date(ann.createdAt), 'PPP')}
                    </CardDescription>
                  </div>
                </CardHeader>
                {ann.expiryDate && (
                  <CardContent className="p-6 pt-0">
                    <p className="text-xs text-muted-foreground mt-4">
                      (Expires on: {format(new Date(ann.expiryDate), 'PPp')})
                    </p>
                  </CardContent>
                )}
              </Card>
            ))}
            {!isLoading && announcements?.length === 0 && (
              <p className="text-center text-muted-foreground py-10">No announcements at the moment.</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AnnouncementsPage;
