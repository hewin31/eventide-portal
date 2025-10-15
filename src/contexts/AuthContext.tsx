// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { login as apiLogin, register as apiRegister } from "../services/authService";

export type UserRole = "member" | "coordinator" | "student";

export interface Club {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  clubs?: Club[];
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { name: string; email: string; password: string; role: UserRole }) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        // The user object is now part of the token payload.
        // We can get it by decoding the token.
        // A more robust solution would be to verify the token, but for client-side
        // state rehydration, decoding is a common practice.
        // The backend ALWAYS verifies the token for secure operations.
        const payload = JSON.parse(atob(token.split('.')[1]));

        // Check if token is expired
        if (payload.exp * 1000 < Date.now()) {
          localStorage.removeItem("token");
          throw new Error("Token expired");
        }
        setUser({ id: payload.id, name: payload.name, email: payload.email, role: payload.role });
      } catch (err) {
        localStorage.removeItem("token");
        setUser(null);
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const data = await apiLogin(email, password);
      if (data.token) {
        localStorage.setItem("token", data.token);
        setUser(data.user);
      } else {
        throw new Error(data.error || "Login failed");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: { name: string; email: string; password: string; role: UserRole }) => {
    setIsLoading(true);
    try {
      const resData = await apiRegister(data);
      if (resData.token && resData.user) {
        localStorage.setItem("token", resData.token);
        setUser(resData.user);
      } else {
        throw new Error(resData.error || "Registration failed");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
