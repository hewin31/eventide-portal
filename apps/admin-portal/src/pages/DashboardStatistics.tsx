import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building, Users, Calendar, UserCog, Activity, BarChart } from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import { API_BASE_URL } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface Club {
  _id: string;
}

interface Coordinator {
  _id: string;
}

interface User {
  _id: string;
}

interface Event { _id: string; }

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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
              <Activity className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="h-48 flex items-center justify-center text-muted-foreground">
                <p>Recent activities will be displayed here.</p>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                (e.g., New clubs, user registrations, event creations)
              </p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-semibold">Data Visualizations</CardTitle>
              <BarChart className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="h-48 flex items-center justify-center text-muted-foreground">
                <p>Graphs and charts will be displayed here.</p>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                (e.g., Club growth, event distribution, user roles)
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default DashboardStatistics;
