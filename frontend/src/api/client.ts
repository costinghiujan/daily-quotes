import axios from 'axios';

const LOCAL_IP = '192.168.1.7'; 
const BASE_URL = `http://${LOCAL_IP}:3000/api`;

console.log('[Axios] Instanța a fost inițializată cu BASE_URL:', BASE_URL);

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 5000, 
  headers: {
    'Content-Type': 'application/json',
  },
});