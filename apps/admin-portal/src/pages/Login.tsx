import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, LogIn } from 'lucide-react';
import { toast } from 'sonner';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // The login function returns the user object, let's capture it.
      const loggedInUser = await login(email, password);
      toast.success('Login successful!');

      // --- Role-Based Redirect Logic ---
      // Check the user's role and navigate to the appropriate dashboard.
      if (loggedInUser.role === 'admin') {
        navigate('/admin/clubs');
      } else {
        navigate('/dashboard');
      }
    } catch (error: any) {
      toast.error(error.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden transition-colors duration-300">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 pointer-events-none animate-pulse" />
      <Card className="w-full max-w-md shadow-2xl bg-gradient-to-br from-card/90 via-card to-card/80 backdrop-blur-xl relative z-10 border-primary/10 animate-bounce-in">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center animate-pulse">
            <div className="bg-gradient-to-br from-primary to-secondary p-4 rounded-full shadow-lg">
              <GraduationCap className="h-10 w-10 text-white" />
            </div>
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl font-bold font-poppins bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-fadeIn">
              Welcome to ClubHub
            </CardTitle>
            <CardDescription className="text-base mt-2 text-foreground/80 transition-colors duration-300">
              Your gateway to college community
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2 animate-slideUp" style={{ animationDelay: '0.1s' }}>
              <Label htmlFor="email" className="text-foreground/90 font-semibold font-inter transition-colors duration-300">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@college.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="transition-all duration-300 font-inter"
              />
            </div>
            <div className="space-y-2 animate-slideUp" style={{ animationDelay: '0.2s' }}>
              <Label htmlFor="password" className="text-foreground/90 font-semibold font-inter transition-colors duration-300">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your secure password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="transition-all duration-300 font-inter"
              />
            </div>
            <Button type="submit" className="w-full h-12 text-lg bg-gradient-to-r from-primary to-secondary text-white hover:shadow-lg hover:shadow-primary/30 transition-all duration-300" disabled={isLoading}>
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin">⏳</span>
                  Signing in...
                </span>
              ) : (
                <>
                  <LogIn className="mr-2 h-5 w-5" />
                  Sign In to ClubHub
                </>
              )}
            </Button>
            <div className="mt-6 text-center text-sm animate-slideUp font-inter" style={{ animationDelay: '0.4s' }}>
              <p className="text-foreground/70">
                Don't have an account?{" "}
                <Link
                  to="/register"
                  className="font-semibold text-accent hover:text-primary transition-all duration-300 hover:underline hover:underline-offset-4"
                >
                  Create one
                </Link>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
