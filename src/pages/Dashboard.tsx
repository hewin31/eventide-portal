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
    <div className="flex min-h-screen w-full bg-background transition-colors duration-300">
      <Sidebar />
      <main className="flex-1 p-8 transition-all duration-300">
        <div className="max-w-7xl mx-auto">
          <div className="mb-10 animate-slideInRight">
            <h1 className="text-5xl font-bold font-poppins mb-3 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent transition-all duration-500">
              My Clubs
            </h1>
            <p className="text-muted-foreground text-lg transition-colors duration-300">
              {user?.role === 'coordinator'
                ? 'Clubs you coordinate and manage'
                : 'Clubs you are a member of'}
            </p>
          </div>

          <h2 className="text-2xl font-poppins font-semibold mb-6 transition-all duration-300 animate-slideInLeft">My Clubs</h2>
          {user?.clubs && user.clubs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 transition-all duration-500">
              {user.clubs.map((club, index) => (
                <div key={club.id} className="animate-slideUp" style={{ animationDelay: `${index * 0.1}s` }}>
                  <ClubCard club={club} onOpen={handleOpenClub} />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center animate-fadeIn">
              <div className="bg-gradient-to-br from-primary/20 via-accent/20 to-primary/20 p-8 rounded-full mb-6 backdrop-blur-md transition-all duration-300 hover:scale-110 hover:shadow-xl hover:shadow-primary/20 animate-float">
                <Users className="h-16 w-16 text-accent transition-transform duration-300" />
              </div>
              <h2 className="text-3xl font-poppins font-semibold mb-3 transition-colors duration-300">No Clubs Yet</h2>
              <p className="text-muted-foreground text-lg max-w-md transition-colors duration-300">
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
