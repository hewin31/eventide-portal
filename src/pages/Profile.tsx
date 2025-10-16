import { useAuth } from '@/contexts/AuthContext';
import { Sidebar } from '@/components/Sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const Profile = () => {
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen w-full bg-background transition-colors duration-300">
      <Sidebar />
      <main className="flex-1 p-8 transition-all duration-300">
        <div className="max-w-3xl mx-auto">
          <div className="animate-slideInRight mb-8">
            <h1 className="text-4xl font-bold font-poppins mb-2 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">Profile</h1>
            <p className="text-muted-foreground transition-colors duration-300">Manage your account and preferences</p>
          </div>

          <Card className="animate-slideUp border-primary/10">
            <CardHeader className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10">
              <CardTitle className="font-poppins text-2xl">User Information</CardTitle>
              <CardDescription>Your account details and role</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="animate-slideUp p-4 rounded-lg bg-card/50 border border-primary/10 transition-all duration-300 hover:border-accent/30 hover:shadow-md hover:shadow-primary/10" style={{ animationDelay: '0.1s' }}>
                <label className="text-sm font-semibold font-inter text-foreground/80">Full Name</label>
                <p className="text-foreground/90 font-inter mt-2 text-lg">{user?.name}</p>
              </div>
              <div className="animate-slideUp p-4 rounded-lg bg-card/50 border border-primary/10 transition-all duration-300 hover:border-accent/30 hover:shadow-md hover:shadow-primary/10" style={{ animationDelay: '0.2s' }}>
                <label className="text-sm font-semibold font-inter text-foreground/80">Email Address</label>
                <p className="text-foreground/90 font-inter mt-2 text-lg break-all">{user?.email}</p>
              </div>
              <div className="animate-slideUp p-4 rounded-lg bg-card/50 border border-primary/10 transition-all duration-300 hover:border-accent/30 hover:shadow-md hover:shadow-primary/10" style={{ animationDelay: '0.3s' }}>
                <label className="text-sm font-semibold font-inter text-foreground/80">Account Role</label>
                <div className="mt-3">
                  <Badge className="capitalize font-semibold bg-gradient-to-r from-primary to-accent text-white px-3 py-1">{user?.role}</Badge>
                </div>
              </div>
              <div className="animate-slideUp p-4 rounded-lg bg-card/50 border border-primary/10 transition-all duration-300 hover:border-accent/30 hover:shadow-md hover:shadow-primary/10" style={{ animationDelay: '0.4s' }}>
                <label className="text-sm font-semibold font-inter text-foreground/80">Clubs</label>
                {user?.clubs && user.clubs.length > 0 ? (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {user.clubs.map((club, index) => (
                      <Badge key={club.id} variant="outline" className="border-accent/50 hover:border-accent transition-all duration-300 px-3 py-1" style={{ animationDelay: `${index * 0.05}s` }}>
                        {club.name}
                      </Badge>
                    ))}
                  </div>
                ) : <p className="text-sm text-muted-foreground mt-2">You are not a member of any clubs yet.</p>}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Profile;
