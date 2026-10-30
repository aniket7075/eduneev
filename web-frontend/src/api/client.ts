import axios from 'axios';

let rawBase = import.meta.env.VITE_API_URL || 'https://backend-1-jet.vercel.app/api';
if (!rawBase.startsWith('http://') && !rawBase.startsWith('https://')) {
  rawBase = `https://${rawBase}`;
}

const BASE_URL = rawBase;

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  async (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const path = window.location.pathname;
      if (path !== '/login' && path !== '/' && !path.startsWith('/enquiry')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const formatMediaUrl = (url: string) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  const prefix = BASE_URL.startsWith('http') ? BASE_URL.replace(/\/api\/?$/, '') : '';
  const cleanUrl = url.startsWith('/') ? url : `/${url}`;
  return `${prefix}${cleanUrl}`;
};

export default apiClient;
