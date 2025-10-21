// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { login as apiLogin, register as apiRegister, getProfile } from "../services/authService";
import { jwtDecode } from "jwt-decode";

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

  const fetchAndSetUser = async () => {
    try {
      const data = await getProfile();
      if (data.user) {
        setUser(data.user);
      } else {
        throw new Error("Failed to fetch user profile.");
      }
    } catch (err) {
      // If profile fetch fails, token is likely invalid/expired
      localStorage.removeItem("token");
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const { exp } = jwtDecode(token);
      if (exp && exp * 1000 < Date.now()) {
        localStorage.removeItem("token");
        setIsLoading(false);
      } else {
        fetchAndSetUser();
      }
    } else {
      setIsLoading(false);
    }
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
