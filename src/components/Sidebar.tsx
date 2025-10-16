import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Home, User, LogOut, GraduationCap, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/ThemeToggle';

interface SidebarProps {
  className?: string;
}

export const Sidebar = ({ className }: SidebarProps) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className={cn("w-64 bg-card/80 backdrop-blur-md border-r-2 border-primary/10 flex flex-col transition-all duration-300 hover:shadow-lg", className)}>
      <div className="p-6 border-b-2 border-primary/10 transition-all duration-300">
        <div className="flex items-center justify-between mb-2 animate-slideDown">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-accent transition-transform duration-300 hover:scale-110" />
            <h1 className="text-xl font-bold font-poppins bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              ClubHub
            </h1>
          </div>
          <ThemeToggle />
        </div>
        <p className="text-sm text-foreground/80 transition-colors duration-300">{user?.name}</p>
        <p className="text-xs text-muted-foreground capitalize transition-colors duration-300">{user?.role}</p>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        <Link to="/dashboard" className="block transition-all duration-300">
          <Button variant="ghost" className="w-full justify-start hover:bg-accent/10 transition-all duration-300">
            <Home className="mr-2 h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
            My Clubs
          </Button>
        </Link>
        <Link to="/events" className="block transition-all duration-300">
          <Button variant="ghost" className="w-full justify-start hover:bg-accent/10 transition-all duration-300">
            <Calendar className="mr-2 h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
            All Events
          </Button>
        </Link>
        <Link to="/profile" className="block transition-all duration-300">
          <Button variant="ghost" className="w-full justify-start hover:bg-accent/10 transition-all duration-300">
            <User className="mr-2 h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
            Profile
          </Button>
        </Link>
      </nav>

      <div className="p-4 border-t-2 border-primary/10 transition-all duration-300">
        <Button
          variant="ghost"
          className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 transition-all duration-300"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </aside>
  );
};
