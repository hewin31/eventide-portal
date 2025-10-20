// src/pages/Register.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, UserRole } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("student");

  const { register, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await register({ name, email, password, role });
      toast.success("Registration successful!");
      navigate("/dashboard");
    } catch (err) {
      // The error from AuthService should have a response object
      if (err && typeof err === 'object' && 'response' in err && err.response && typeof err.response === 'object' && 'data' in err.response && err.response.data && typeof err.response.data === 'object' && 'error' in err.response.data) {
        toast.error(err.response.data.error as string);
      } else {
        toast.error("Registration failed. Please try again.");
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden transition-colors duration-300">
      <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-transparent to-primary/10 pointer-events-none animate-pulse" />
      <Card className="w-full max-w-md shadow-2xl bg-gradient-to-br from-card/90 via-card to-card/80 backdrop-blur-xl relative z-10 border-primary/10 animate-bounce-in">
        <CardHeader className="text-center space-y-3">
          <div className="flex justify-center">
            <div className="bg-gradient-to-br from-accent via-primary to-accent p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-primary/20">
              <UserPlus className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="animate-slideDown">
            <CardTitle className="text-3xl font-bold font-poppins text-transparent bg-gradient-to-r from-primary via-accent to-primary bg-clip-text">Create an Account</CardTitle>
            <CardDescription className="text-base mt-2 text-foreground/80">Register to manage your college clubs</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="animate-slideUp" style={{ animationDelay: '0.1s' }}>
              <Label htmlFor="name" className="font-inter font-semibold">Full Name</Label>
              <Input id="name" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} required className="font-inter" />
            </div>
            <div className="animate-slideUp" style={{ animationDelay: '0.2s' }}>
              <Label htmlFor="email" className="font-inter font-semibold">Email Address</Label>
              <Input id="email" type="email" placeholder="you@college.edu" value={email} onChange={(e) => setEmail(e.target.value)} required className="font-inter" />
            </div>
            <div className="animate-slideUp" style={{ animationDelay: '0.3s' }}>
              <Label htmlFor="password" className="font-inter font-semibold">Password</Label>
              <Input id="password" type="password" placeholder="Create a strong password" value={password} onChange={(e) => setPassword(e.target.value)} required className="font-inter" />
            </div>
            <div className="animate-slideUp" style={{ animationDelay: '0.4s' }}>
              <Label htmlFor="role" className="font-inter font-semibold">Role</Label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full h-10 px-3 py-2 border-2 border-input bg-input text-foreground rounded-lg transition-all duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent focus:shadow-xl focus:shadow-accent/30 hover:border-muted font-inter"
              >
                <option value="student">Student</option>
                <option value="member">Member</option>
                <option value="coordinator">Coordinator</option>
              </select>
            </div>
            <Button type="submit" className="w-full h-12 text-lg font-poppins font-semibold animate-slideUp transition-all duration-300 bg-gradient-to-r from-primary to-secondary text-white hover:shadow-lg hover:shadow-primary/30" style={{ animationDelay: '0.5s' }} disabled={isLoading}>
              {isLoading ? "Registering..." : <><UserPlus className="mr-2 h-4 w-4" /> Register</>}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );

};

export default Register;
