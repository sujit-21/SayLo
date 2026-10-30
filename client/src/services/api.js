import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercept requests and attach Bearer token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('saylo_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercept responses to handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const currentPath = window.location.pathname;
      if (!currentPath.startsWith('/login') && !currentPath.startsWith('/register')) {
        localStorage.removeItem('saylo_token');
        localStorage.removeItem('saylo_user');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
