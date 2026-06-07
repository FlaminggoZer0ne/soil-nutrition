import axios from 'axios';

// In production, VITE_API_URL points to the backend URL
// In development, empty string lets Vite proxy handle /api -> localhost:5000
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor to inject JWT token in header
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor to handle authentication failures
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Invalidate local session if token expired
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Redirect to login only if not already there
      if (!window.location.pathname.includes('/login') && window.location.pathname !== '/') {
        window.location.href = '/login?expired=true';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
