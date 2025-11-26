import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import {
  Home,
  Target,
  Calendar,
  FileCheck,
  User,
  LogOut,
  Menu,
} from 'lucide-react';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

export const TopNav = () => {
  const location = useLocation();
  const { isAuthenticated, logout, user } = useAuth();

  const navItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/for-you', label: 'For You', icon: Target },
    { path: '/my-events', label: 'My Events', icon: Calendar },
    { path: '/od-approvals', label: 'OD Approvals', icon: FileCheck },
    { path: '/profile', label: 'Profile', icon: User },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-40 bg-card border-b border-border">
      <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6 md:py-4">
        <Link to="/" className="flex items-center space-x-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-secondary">
            <Calendar className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold text-foreground md:text-xl">Campus Events</span>
        </Link>

        <div className="hidden items-center space-x-1 md:flex">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.path} to={item.path}>
                <Button
                  variant={isActive(item.path) ? 'default' : 'ghost'}
                  className="flex items-center space-x-2"
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Button>
              </Link>
            );
          })}
        </div>

        <div className="hidden items-center space-x-3 md:flex">
          <ThemeToggle />
          {isAuthenticated ? (
            <>
              <span className="text-sm text-muted-foreground">{user?.username}</span>
              <Button variant="outline" onClick={logout} size="sm">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  Login
                </Button>
              </Link>
              <Link to="/signup">
                <Button size="sm">Sign Up</Button>
              </Link>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full max-w-sm p-0">
              <div className="flex flex-col space-y-6 p-6">
                <SheetHeader className="space-y-1 text-left">
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>

                {isAuthenticated ? (
                  <div className="space-y-3">
                    <div className="rounded-lg bg-muted px-4 py-3">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Signed in as</p>
                      <p className="truncate text-sm font-medium text-foreground">{user?.username}</p>
                    </div>
                    <SheetClose asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-center"
                        onClick={logout}
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                      </Button>
                    </SheetClose>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <SheetClose asChild>
                      <Link to="/login">
                        <Button variant="outline" className="w-full justify-start">
                          Login
                        </Button>
                      </Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link to="/signup">
                        <Button className="w-full justify-start">Sign Up</Button>
                      </Link>
                    </SheetClose>
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);
                    return (
                      <SheetClose key={item.path} asChild>
                        <Link to={item.path}>
                          <Button
                            variant={active ? 'secondary' : 'ghost'}
                            className="w-full justify-start gap-3"
                          >
                            <Icon className="h-4 w-4" />
                            <span>{item.label}</span>
                          </Button>
                        </Link>
                      </SheetClose>
                    );
                  })}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};
