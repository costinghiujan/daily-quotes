import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { Alert } from 'react-native';
import { storage } from '../utils/storage';
import { apiClient } from '../api/client';
import { UserProfile } from '../api/userService';

interface AuthContextType {
  user: UserProfile | null;
  userToken: string | null;
  isLoading: boolean;
  loginState: (token: string) => void;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  userToken: null,
  isLoading: true,
  loginState: () => {},
  logout: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [userToken, setUserToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
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

  useEffect(() => {
    const interceptor = apiClient.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response && error.response.status === 401) {
          Alert.alert(
            'Sesiune Inactivă', 
            'Acest dispozitiv a fost deconectat de la distanță sau sesiunea a expirat.'
          );
          
          await logout();
        }
        
        return Promise.reject(error);
      }
    );

    return () => {
      apiClient.interceptors.response.eject(interceptor);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, userToken, isLoading, loginState, logout }}>
      {children}
    </AuthContext.Provider>
  );
};