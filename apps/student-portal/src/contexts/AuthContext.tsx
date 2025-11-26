import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define the shape of the user object that your backend sends
interface User {
  id: string; // Or _id, depending on your backend
  email: string;
  name: string; // Changed from username to name
  // You can add other fields like id, role, etc., if your backend provides them
}

// Define the shape of the authentication context's state and functions
interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  signup: (name: string, email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Define the base URL for your authentication API endpoints, which are on port 5000
const API_BASE_URL = 'http://localhost:5000/api/auth';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // On initial app load, check localStorage to see if the user is already logged in
    const storedUser = localStorage.getItem('campus-event-user');
    const storedToken = localStorage.getItem('campus-event-token');
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      setToken(storedToken);
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        // The server responded with an error (e.g., 401 Invalid Credentials)
        return { success: false, message: data.message || 'Login failed.' };
      }

      // Assuming the server responds with { user: User, token: string } on success
      setUser({ id: data.user.id, name: data.user.name, email: data.user.email });
      setToken(data.token);
      localStorage.setItem('campus-event-user', JSON.stringify(data.user));
      localStorage.setItem('campus-event-token', data.token);
      return { success: true };
    } catch (error) {
      console.error('Login API error:', error);
      return { success: false, message: 'A network error occurred. Is the server running?' };
    }
  };

  const signup = async (name: string, email: string, password: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role: 'student' }),
      });

      const data = await response.json();

      if (!response.ok) {
        // The server responded with an error (e.g., 409 User already exists)
        return { success: false, message: data.message || 'Signup failed.' };
      }

      return { success: true, message: 'Signup successful! Please log in.' };
    } catch (error) {
      console.error('Signup API error:', error);
      return { success: false, message: 'A network error occurred. Is the server running?' };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('campus-event-user');
    localStorage.removeItem('campus-event-token');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, signup, logout, isAuthenticated: !!user && !!token }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
