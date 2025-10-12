import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Sidebar } from '@/components/Sidebar';
import { ClubCard } from '@/components/ClubCard';
import { Users } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleOpenClub = (clubId: string) => {
    navigate(`/club/${clubId}`);
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-10">
            <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              My Clubs
            </h1>
            <p className="text-muted-foreground text-lg">
              {user?.role === 'coordinator' 
                ? 'Clubs you coordinate and manage' 
                : 'Clubs you are a member of'}
            </p>
          </div>

          {user?.clubs && user.clubs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {user.clubs.map((club) => (
                <ClubCard key={club.id} club={club} onOpen={handleOpenClub} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 p-8 rounded-full mb-6 backdrop-blur-sm">
                <Users className="h-16 w-16 text-primary" />
              </div>
              <h2 className="text-3xl font-semibold mb-3">No Clubs Yet</h2>
              <p className="text-muted-foreground text-lg max-w-md">
                You haven't joined any clubs yet. Contact your coordinator to get started.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
