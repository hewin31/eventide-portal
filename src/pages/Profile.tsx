import { useAuth } from '@/contexts/AuthContext';
import { Sidebar } from '@/components/Sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const Profile = () => {
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">Profile</h1>
          
          <Card>
            <CardHeader>
              <CardTitle>User Information</CardTitle>
              <CardDescription>Your account details and role</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-semibold">Name</label>
                <p className="text-muted-foreground">{user?.name}</p>
              </div>
              <div>
                <label className="text-sm font-semibold">Email</label>
                <p className="text-muted-foreground">{user?.email}</p>
              </div>
              <div>
                <label className="text-sm font-semibold">Role</label>
                <div className="mt-1">
                  <Badge className="capitalize">{user?.role}</Badge>
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold">Clubs</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {user?.clubs.map((club) => (
                    <Badge key={club.id} variant="outline">{club.name}</Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Profile;
