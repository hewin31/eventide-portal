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
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">My Clubs</h1>
            <p className="text-muted-foreground">
              {user?.role === 'coordinator' 
                ? 'Clubs you coordinate and manage' 
                : 'Clubs you are a member of'}
            </p>
          </div>

          {user?.clubs && user.clubs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {user.clubs.map((club) => (
                <ClubCard key={club.id} club={club} onOpen={handleOpenClub} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="bg-muted p-6 rounded-full mb-4">
                <Users className="h-12 w-12 text-muted-foreground" />
              </div>
              <h2 className="text-2xl font-semibold mb-2">No Clubs Yet</h2>
              <p className="text-muted-foreground">
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
