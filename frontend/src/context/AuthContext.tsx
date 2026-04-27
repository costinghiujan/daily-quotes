import React, { createContext, useState, useEffect, ReactNode, useRef, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../api/client';
import { authService } from '../api/authService';
import { UserProfile } from '../api/userService';
import { AlertContext } from './AlertContext';
import { storage } from '../utils/storage';

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
  const { showAlert } = React.useContext(AlertContext);

  // Use ref to avoid stale closure in interceptor
  const logoutRef = useRef<() => Promise<void>>(async () => {});
  const showAlertRef = useRef(showAlert);

  // Keep showAlert ref in sync
  useEffect(() => {
    showAlertRef.current = showAlert;
  }, [showAlert]);

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

  const logout = useCallback(async () => {
    // Call backend to invalidate session first
    try {
      await authService.logout();
    } catch (error) {
      console.error('[Logout] Eroare la deconectare backend:', error);
    }
    // Clear all stored data to prevent session bleed
    await storage.removeToken();
    await AsyncStorage.removeItem('userData');
    await AsyncStorage.removeItem('app_language');
    // Clear axios default auth header to prevent stale tokens
    delete apiClient.defaults.headers.common['Authorization'];

    setUserToken(null);
    setUser(null);
  }, []);

  // Keep ref in sync
  logoutRef.current = logout;

  useEffect(() => {
    const interceptor = apiClient.interceptors.response.use(
      (response) => response,
      async (error) => {
        // Skip 401 handling for logout endpoint to prevent infinite loop
        const isLogoutEndpoint = error.config?.url?.includes('/auth/logout');
        if (error.response && error.response.status === 401 && !isLogoutEndpoint) {
          // Use ref to avoid stale closure issues
          showAlertRef.current({
            title: 'Sesiune Inactivă',
            message: 'Acest dispozitiv a fost deconectat de la distanță sau sesiunea a expirat.',
            confirmText: 'OK',
            hideCancel: true,
            onConfirm: async () => {
              if (logoutRef.current) {
                await logoutRef.current();
              }
            },
          });
        }

        return Promise.reject(error);
      },
    );

    return () => {
      apiClient.interceptors.response.eject(interceptor);
    };
    // Only register interceptor once - use refs for dynamic values
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  return (
    <AuthContext.Provider value={{ user, userToken, isLoading, loginState, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
