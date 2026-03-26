import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { storage } from '../utils/storage';
import { apiClient } from '../api/client';
import { UserProfile } from '../api/userService';

interface AuthContextType {
  user: UserProfile | null;
  userToken: string | null;
  isLoading: boolean;
  loginState: (token: string, userData: UserProfile) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  userToken: null,
  isLoading: true,
  loginState: async () => {},
  logout: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [userToken, setUserToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadStorageData = async () => {
      try {
        const token = await storage.getToken();
        const storedUser = await AsyncStorage.getItem('userData');

        if (token && storedUser) {
          setUserToken(token);
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('[Eroare AuthContext - Încărcare Date]:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStorageData();
  }, []);

  const loginState = async (token: string, userData: UserProfile) => {
    setUserToken(token);
    setUser(userData);

    await AsyncStorage.setItem('userData', JSON.stringify(userData));
  };

  const logout = async () => {
    setIsLoading(true);
    await storage.removeToken();
    await AsyncStorage.removeItem('userData');

    setUserToken(null);
    setUser(null);
    setIsLoading(false);
  };

  useEffect(() => {
    const interceptor = apiClient.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response && error.response.status === 401) {
          Alert.alert(
            'Sesiune Inactivă',
            'Acest dispozitiv a fost deconectat de la distanță sau sesiunea a expirat.',
          );

          await logout();
        }

        return Promise.reject(error);
      },
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
