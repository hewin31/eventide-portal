import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { SignInRequired } from '@/components/auth/SignInRequired';
import {
  Mail,
  User as UserIcon,
  Calendar,
  Award,
  LogOut,
  Building,
  Sparkles,
  Save,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Event } from '@/lib/api';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const API_BASE_URL = 'http://localhost:5000/api';

async function fetchMyEvents(token: string | null): Promise<Event[]> {
  if (!token) throw new Error('Not authenticated');
  const res = await fetch(`${API_BASE_URL}/events/my-events`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error('Failed to fetch your registered events.');
  }
  return res.json();
}

async function fetchUserProfile(token: string | null) {
  if (!token) throw new Error('Not authenticated');
  const res = await fetch(`${API_BASE_URL}/profile/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch user profile');
  return res.json();
}

async function updateUserProfile({ token, department, interests }: { token: string | null, department?: string, interests: string[] }) {
  if (!token) throw new Error('Not authenticated');
  const res = await fetch(`${API_BASE_URL}/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ department, interests: interests.join(',') }), // Convert array to comma-separated string
  });
  if (!res.ok) {
    throw new Error('Failed to update profile');
  }
  return res.json();
}

const departments = [
  'Computer Science',
  'Information Technology',
  'Electronics',
  'Electrical',
  'Mechanical',
  'Civil',
];

const interestsList = [
  'AI',
  'Machine Learning',
  'Robotics',
  'Cloud',
  'Cybersecurity',
  'IoT',
  'Embedded Systems',
  'CAD',
  '3D Printing',
  'Automation',
  'Sustainability',
  'Power Systems',
  'Networking',
  'Web Development',
];

export const Profile = () => {
  const { user, logout, isAuthenticated, token } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const { data: registeredEvents, isLoading } = useQuery({
    queryKey: ['myEvents'],
    queryFn: () => fetchMyEvents(token),
    enabled: isAuthenticated,
  });

  const { data: userProfile } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => fetchUserProfile(token),
    enabled: isAuthenticated,
  });

  const [department, setDepartment] = useState<string | undefined>(undefined);
  const [interests, setInterests] = useState<string[]>([]);

  useEffect(() => {
    if (userProfile) {
      setDepartment(userProfile.department);
      // The backend sends a comma-separated string, so we split it into an array.
      setInterests(userProfile.interests ? userProfile.interests.split(',') : []);
    }
  }, [userProfile]);

  const profileMutation = useMutation({
    mutationFn: updateUserProfile,
    onSuccess: () => {
      toast.success('Profile updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    },
    onError: (error: Error) => {
      toast.error(`Update failed: ${error.message}`);
    },
  });

  const toggleInterest = (interest: string) =>
    setInterests(prev => (prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]));

  const attendedEventsCount =
    registeredEvents?.filter(event => new Date(event.endDateTime) < new Date()).length ?? 0;
  const activeRegistrationsCount = registeredEvents?.length ?? 0;

  if (!isAuthenticated) {
    return (
      <SignInRequired description="Please sign in to view your profile." />
    );
  }

  const initials = user?.name?.slice(0, 2).toUpperCase() || 'U';

  return (
    <div className="min-h-screen pb-20 md:pb-8 px-6 py-8">
      <div className="max-w-4xl mx-auto">
        <Card className="overflow-hidden">
          <div className="h-32 bg-gradient-to-br from-primary via-secondary to-accent" />
          <CardHeader className="relative pb-0">
            <div className="flex flex-col md:flex-row md:items-end md:space-x-6 -mt-16">
              <Avatar className="w-24 h-24 border-4 border-card shadow-elevated">
                <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-primary to-secondary text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="mt-4 md:mt-0 md:mb-2 flex-1">
                <CardTitle className="text-3xl">{user?.name}</CardTitle>
                <p className="text-muted-foreground">{user?.email}</p>
              </div>
              <Button variant="outline" onClick={handleLogout} className="mt-4 md:mt-0 md:mb-2">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    <CardTitle className="text-lg">Registered Events</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <p className="text-3xl font-bold text-primary">...</p>
                  ) : (
                    <p className="text-3xl font-bold text-primary">{activeRegistrationsCount}</p>
                  )}
                  <p className="text-sm text-muted-foreground">Total registrations</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-2">
                    <Award className="w-5 h-5 text-accent" />
                    <CardTitle className="text-lg">Attended Events</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <p className="text-3xl font-bold text-accent">...</p>
                  ) : (
                    <p className="text-3xl font-bold text-accent">{attendedEventsCount}</p>
                  )}
                  <p className="text-sm text-muted-foreground">Events attended</p>
                </CardContent>
              </Card>
            </div>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <UserIcon className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Username</p>
                    <p className="font-medium">{user?.name}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{user?.email}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Your Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center space-x-3">
                  <Building className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Department</p>
                    <Select value={department} onValueChange={setDepartment}>
                      <SelectTrigger className="w-full md:w-[300px] mt-1">
                        <SelectValue placeholder="Select your department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map(dept => (
                          <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Sparkles className="w-5 h-5 text-muted-foreground mt-1" />
                  <div>
                    <p className="text-sm text-muted-foreground">Interests</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {interestsList.map(interest => (
                        <Badge key={interest} variant={interests.includes(interest) ? 'default' : 'secondary'} onClick={() => toggleInterest(interest)} className="cursor-pointer">{interest}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <Button onClick={() => profileMutation.mutate({ token, department, interests })} disabled={profileMutation.isPending}>
                  <Save className="w-4 h-4 mr-2" />
                  {profileMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
