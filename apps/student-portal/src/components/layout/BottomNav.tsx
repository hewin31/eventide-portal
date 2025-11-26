import { Link, useLocation } from 'react-router-dom';
import { Home, Target, Calendar, FileCheck, User } from 'lucide-react';

export const BottomNav = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/for-you', label: 'For You', icon: Target },
    { path: '/my-events', label: 'My Events', icon: Calendar },
    { path: '/od-approvals', label: 'OD Approvals', icon: FileCheck },
    { path: '/profile', label: 'Profile', icon: User },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
      <div className="flex items-center justify-around px-2 py-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <Link 
              key={item.path} 
              to={item.path}
              className="flex flex-col items-center space-y-1 flex-1"
            >
              <div className={`p-2 rounded-lg transition-all ${
                active 
                  ? 'bg-gradient-to-br from-primary to-secondary text-primary-foreground' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className={`text-xs ${active ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
