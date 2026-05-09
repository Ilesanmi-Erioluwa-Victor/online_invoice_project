import axios from 'axios';

// Axios instance — baseURL switches between local .env and Vercel .env.production.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

// Attach JWT token from localStorage to every outgoing API request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;
