import React, { createContext, useContext, useState, ReactNode } from 'react';
import webhookService from '../services/webhookService';

interface User {
  id: string;
  name: string;
  email: string;
  businessName?: string;
  industry?: string;
  businessSize?: string;
  onboardingComplete: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  completeOnboarding: (businessData: { businessName: string; industry: string; businessSize: string }) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  const login = async (email: string, password: string): Promise<boolean> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock successful login
    if (email && password) {
      const userData = {
        id: Date.now().toString(),
        name: 'John Doe',
        email: email,
        onboardingComplete: false
      };
      
      setUser(userData);
      
      // Send login data to n8n/Google Sheets
      try {
        await webhookService.sendUserRegistrationData({
          userId: userData.id,
          userName: userData.name,
          userEmail: userData.email,
          registrationMethod: 'login',
          metadata: {
            userAgent: navigator.userAgent,
            referrer: document.referrer
          }
        });
      } catch (error) {
        console.error('Failed to send login data to webhook:', error);
      }
      
      return true;
    }
    return false;
  };

  const signup = async (name: string, email: string, password: string): Promise<boolean> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock successful signup
    if (name && email && password) {
      const userData = {
        id: Date.now().toString(),
        name: name,
        email: email,
        onboardingComplete: false
      };
      
      setUser(userData);
      
      // Send signup data to n8n/Google Sheets
      try {
        await webhookService.sendUserRegistrationData({
          userId: userData.id,
          userName: userData.name,
          userEmail: userData.email,
          registrationMethod: 'signup',
          metadata: {
            userAgent: navigator.userAgent,
            referrer: document.referrer
          }
        });
      } catch (error) {
        console.error('Failed to send signup data to webhook:', error);
      }
      
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
  };

  const updateUser = (userData: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...userData } : null);
  };

  const completeOnboarding = (businessData: { businessName: string; industry: string; businessSize: string }) => {
    setUser(prev => prev ? {
      ...prev,
      ...businessData,
      onboardingComplete: true
    } : null);
  };

  const value: AuthContextType = {
    user,
    login,
    signup,
    logout,
    updateUser,
    completeOnboarding
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};