import axios from 'axios';

const baseURL = import.meta.env.VITE_APP_API_URL || 'http://localhost:8080';

const http = axios.create({ baseURL });

http.interceptors.request.use(
  async (config) => {
    // Prefer token if present, fallback to serviceToken to align with existing app
    const accessToken = localStorage.getItem('token') || localStorage.getItem('serviceToken');
    if (accessToken) {
      config.headers['Authorization'] = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401 && !window.location.href.includes('/login')) {
      window.location.pathname = '/login';
    }
    return Promise.reject(error);
  }
);

export default http;
