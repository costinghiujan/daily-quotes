import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { storage } from '../utils/storage';

interface AuthContextType {
  userToken: string | null;
  isLoading: boolean;
  loginState: (token: string) => void;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  userToken: null,
  isLoading: true,
  loginState: () => {},
  logout: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [userToken, setUserToken] = useState<string | null>(null);
  
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkToken = async () => {
      try {
        const token = await storage.getToken();
        if (token) {
          setUserToken(token);
        }
      } catch (error) {
        console.error('[Eroare AuthContext - Verificare Token]:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkToken();
  }, []);

  const loginState = (token: string) => {
    setUserToken(token);
  };

  const logout = async () => {
    setIsLoading(true);
    await storage.removeToken();
    setUserToken(null);
    setIsLoading(false);
  };

  return (
    <AuthContext.Provider value={{ userToken, isLoading, loginState, logout }}>
      {children}
    </AuthContext.Provider>
  );
};