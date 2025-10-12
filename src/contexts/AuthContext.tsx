import React, { createContext, useContext, useState, useEffect } from 'react';

export type UserRole = 'member' | 'coordinator';

export interface Club {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
}

export interface User {
  userId: string;
  name: string;
  email: string;
  role: UserRole;
  clubs: Club[];
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    // Mock login - in production this would call your backend API
    // For demo purposes, we'll create different users based on email
    const mockUser: User = email.includes('coordinator') 
      ? {
          userId: '1',
          name: 'Dr. Faculty Coordinator',
          email,
          role: 'coordinator',
          clubs: [
            { id: 'c1', name: 'Music Club', description: 'A club for music enthusiasts', imageUrl: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&h=400&fit=crop' },
            { id: 'c2', name: 'Drama Club', description: 'Theatrical performances and workshops', imageUrl: 'https://images.unsplash.com/photo-1507924538820-ede94a04019d?w=400&h=400&fit=crop' },
            { id: 'c3', name: 'Coding Club', description: 'Learn and practice programming', imageUrl: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=400&fit=crop' },
          ],
        }
      : {
          userId: '2',
          name: 'Student Member',
          email,
          role: 'member',
          clubs: [
            { id: 'c1', name: 'Music Club', description: 'A club for music enthusiasts', imageUrl: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&h=400&fit=crop' },
            { id: 'c2', name: 'Drama Club', description: 'Theatrical performances and workshops', imageUrl: 'https://images.unsplash.com/photo-1507924538820-ede94a04019d?w=400&h=400&fit=crop' },
          ],
        };

    localStorage.setItem('user', JSON.stringify(mockUser));
    setUser(mockUser);
  };

  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
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
