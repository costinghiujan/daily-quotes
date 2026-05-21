import axios from 'axios';
import { storage } from '../utils/storage';
import Constants from 'expo-constants';

const debuggerHost = Constants.expoConfig?.hostUri;

const dynamicIp = debuggerHost ? debuggerHost.split(':')[0] : null;

export const BASE_URL = dynamicIp ? `http://${dynamicIp}:3000/api` : 'http://localhost:3000/api';

console.log('[Axios] Instanța a fost inițializată cu BASE_URL:', BASE_URL);

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 5000,
});

apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await storage.getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        // Ensure no stale auth header bleeds through
        delete config.headers.Authorization;
      }
    } catch (error) {
      console.error('[Eroare Axios Interceptor] Nu s-a putut injecta token-ul:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);
