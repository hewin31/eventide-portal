import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Home, User, LogOut, GraduationCap, Calendar, CheckSquare, ShieldCheck, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/ThemeToggle';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface SidebarProps {
  className?: string;
}

interface NavLink {
  to: string;
  icon: LucideIcon;
  label: string;
  roles?: ('student' | 'member' | 'coordinator')[];
}

const mainNavLinks: NavLink[] = [
  { to: '/dashboard', icon: Home, label: 'My Clubs' },
  { to: '/events', icon: Calendar, label: 'All Events' },
  { to: '/profile', icon: User, label: 'Profile' },
];

export const Sidebar = ({ className }: SidebarProps) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isLogoutAlertOpen, setIsLogoutAlertOpen] = useState(false);

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
        {mainNavLinks.map((link) => (
          <Link key={link.to} to={link.to} className="block transition-all duration-300">
            <Button variant="ghost" className="w-full justify-start hover:bg-accent/10 transition-all duration-300">
              <link.icon className="mr-2 h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
              {link.label}
            </Button>
          </Link>
        ))}
      </nav>

      {user?.role === 'coordinator' && (
        <div className="p-4 space-y-2 border-t-2 border-primary/10">
           <h3 className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Coordinator Tools</h3>
           <Link to="/approvals/events" className="block transition-all duration-300">
            <Button variant="ghost" className="w-full justify-start hover:bg-accent/10 transition-all duration-300">
              <ShieldCheck className="mr-2 h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
              Event Approvals
            </Button>
          </Link>
          <Link to="/approvals/od" className="block transition-all duration-300">
            <Button variant="ghost" className="w-full justify-start hover:bg-accent/10 transition-all duration-300">
              <CheckSquare className="mr-2 h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
              OD Management
            </Button>
          </Link>
        </div>
      )}

      <div className="p-4 border-t-2 border-primary/10 transition-all duration-300">
        <AlertDialog open={isLogoutAlertOpen} onOpenChange={setIsLogoutAlertOpen}>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 transition-all duration-300"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure you want to log out?</AlertDialogTitle>
              <AlertDialogDescription>
                You will be returned to the login screen.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleLogout} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Logout
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </aside>
  );
};
