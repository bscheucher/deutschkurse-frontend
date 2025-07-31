import axios, { AxiosInstance } from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api/v1';

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
      toast.error('Sitzung abgelaufen. Bitte melden Sie sich erneut an.');
    } else if (error.response?.status === 403) {
      toast.error('Keine Berechtigung für diese Aktion.');
    } else if (error.response?.status >= 500) {
      toast.error('Serverfehler. Bitte versuchen Sie es später erneut.');
    }
    return Promise.reject(error);
  }
);

export default api;