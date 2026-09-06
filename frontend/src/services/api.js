import axios from 'axios';

const API = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Inject Authorization header
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('mineguard_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response Interceptor
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token if unauthenticated
      if (window.location.pathname !== '/login') {
        localStorage.removeItem('mineguard_token');
        localStorage.removeItem('mineguard_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default API;
