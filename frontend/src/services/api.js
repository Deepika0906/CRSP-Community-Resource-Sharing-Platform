import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
export const UPLOADS_URL = import.meta.env.VITE_UPLOADS_URL || 'http://localhost:5000';

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('crsp_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token invalid/expired: force logout so the app doesn't sit in a
      // broken authenticated-looking state.
      localStorage.removeItem('crsp_token');
      localStorage.removeItem('crsp_user');
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Helper to build a full URL for an image that may be a relative /uploads path
export const resolveImageUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${UPLOADS_URL}${path}`;
};

export default api;
