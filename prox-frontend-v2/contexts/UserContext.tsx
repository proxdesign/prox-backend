'use client';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface User {
  id: number;
  email: string;
  name: string;
  created_at?: string;
  preferences?: any;
}

interface UserContextType {
  user: User | null;
  isLoading: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUser = localStorage.getItem('prox_user');
        const storedToken = localStorage.getItem('prox_token');
        
        if (storedUser && storedToken) {
          const userData = JSON.parse(storedUser);
          
          // Verify token is still valid by making a test request
          const response = await fetch('/api/auth/verify', {
            headers: {
              'Authorization': `Bearer ${storedToken}`
            }
          });
          
          if (response.ok) {
            setUser(userData);
          } else {
            // Token expired or invalid, clear storage
            localStorage.removeItem('prox_user');
            localStorage.removeItem('prox_token');
          }
        }
      } catch (error) {
        console.error('Error loading user:', error);
        localStorage.removeItem('prox_user');
        localStorage.removeItem('prox_token');
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = (userData: User, token: string) => {
    setUser(userData);
    localStorage.setItem('prox_user', JSON.stringify(userData));
    localStorage.setItem('prox_token', token);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('prox_user');
    localStorage.removeItem('prox_token');
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem('prox_user', JSON.stringify(updatedUser));
    }
  };

  const value: UserContextType = {
    user,
    isLoading,
    login,
    logout,
    updateUser
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}

// Helper hook to get auth headers for API requests
export function useAuthHeaders() {
  const getAuthHeaders = () => {
    const token = localStorage.getItem('prox_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  };

  return { getAuthHeaders };
}