import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building, Users, Calendar, UserCog, Activity, BarChart } from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import { API_BASE_URL } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { ResponsiveContainer, BarChart as RechartsBarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend } from 'recharts';
import { formatDistanceToNow } from 'date-fns';

interface Club {
  _id: string;
}

interface Coordinator {
  _id: string;
}

interface User {
  _id: string;
  role: string;
}

interface Event {
  _id: string;
  club: string;
}

interface ActivityItem {
  _id: string;
  type: 'Club' | 'User' | 'Event';
  title: string;
  createdAt: string;
}

async function fetchAllClubs(token: string | null) {
  const res = await fetch(`${API_BASE_URL}/api/clubs`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch clubs');
  return res.json();
}

async function fetchCoordinators(token: string | null) {
  const res = await fetch(`${API_BASE_URL}/api/users/coordinators`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch coordinators');
  return res.json();
}

async function fetchAllUsers(token: string | null) {
  const res = await fetch(`${API_BASE_URL}/api/admin/users/all`, { // Use the dedicated admin endpoint for all users
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch users');
  return res.json();
}

async function fetchAllAdminEvents(token: string | null) {
  const res = await fetch(`${API_BASE_URL}/api/admin/events`, { // Use a dedicated admin endpoint for all events
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch events');
  return res.json();
}

async function fetchRecentActivity(token: string | null) {
  const res = await fetch(`${API_BASE_URL}/api/admin/recent-activity`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch recent activity');
  return res.json();
}

const DashboardStatistics = () => {
  const token = localStorage.getItem('token');

  const { data: clubs, isLoading: isLoadingClubs } = useQuery<Club[]>({
    queryKey: ['clubs'],
    queryFn: () => fetchAllClubs(token),
    enabled: !!token,
  });

  const { data: coordinators, isLoading: isLoadingCoordinators } = useQuery<Coordinator[]>({
    queryKey: ['coordinators'],
    queryFn: () => fetchCoordinators(token),
    enabled: !!token,
  });

  const { data: users, isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: () => fetchAllUsers(token),
    enabled: !!token,
  });

  const { data: events, isLoading: isLoadingEvents } = useQuery<Event[]>({
    queryKey: ['events'],
    queryFn: () => fetchAllAdminEvents(token),
    enabled: !!token,
  });

  const { data: activities, isLoading: isLoadingActivities } = useQuery<ActivityItem[]>({
    queryKey: ['recentActivity'],
    queryFn: () => fetchRecentActivity(token),
    enabled: !!token,
  });

  // --- Chart Data Processing ---
  const eventsPerClubData = useMemo(() => {
    if (!clubs || !events) return [];
    return clubs.map(club => ({
      name: club.name.length > 15 ? `${club.name.substring(0, 12)}...` : club.name,
      events: events.filter(event => event.club === club._id).length,
    })).filter(data => data.events > 0); // Only show clubs with events
  }, [clubs, events]);

  const ActivityIcon = ({ type }: { type: ActivityItem['type'] }) => {
    switch (type) {
      case 'Club':
        return <Building className="h-4 w-4 text-primary" />;
      case 'User':
        return <Users className="h-4 w-4 text-green-500" />;
      case 'Event':
        return <Calendar className="h-4 w-4 text-purple-500" />;
      default:
        return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };


  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <main className="flex-1 p-8">
        <h1 className="text-4xl font-bold mb-8">Admin Overview</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Clubs</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoadingClubs ? '...' : clubs?.length ?? 0}
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Coordinators</CardTitle>
              <UserCog className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoadingCoordinators ? '...' : coordinators?.length ?? 0}
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Members</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoadingUsers ? '...' : users?.length ?? 0}
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Events</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoadingEvents ? '...' : events?.length ?? 0}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="lg:col-span-1 hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
              <Activity className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoadingActivities ? (
                <p>Loading activities...</p>
              ) : activities && activities.length > 0 ? (
                <ul className="space-y-4">
                  {activities.map(activity => (
                    <li key={`${activity.type}-${activity._id}`} className="flex items-center gap-4">
                      <ActivityIcon type={activity.type} />
                      <div className="flex-grow">
                        <p className="text-sm font-medium leading-none truncate">{activity.title}</p>
                        <p className="text-xs text-muted-foreground">
                          New {activity.type}
                          {activity.createdAt && 
                            ` · ${formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}`}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No recent activity found.</p>
              )}
            </CardContent>
          </Card>
          <Card className="lg:col-span-2 hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-semibold">Data Visualizations</CardTitle>
              <BarChart className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="h-[300px]">
              <div className="h-full flex flex-col">
                <h3 className="text-center text-sm font-medium text-muted-foreground mb-2">Events per Club</h3>
                <ResponsiveContainer width="100%" height="100%" className="flex-grow">
                  {eventsPerClubData.length > 0 ? (
                    <RechartsBarChart data={eventsPerClubData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                      <XAxis dataKey="name" fontSize={10} interval={0} tickLine={false} axisLine={false} />
                      <YAxis allowDecimals={false} fontSize={12} />
                      <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }} />
                      <Bar dataKey="events" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </RechartsBarChart>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground text-sm">No event data</div>
                  )}
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default DashboardStatistics;
