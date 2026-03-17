import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API_BASE = `${BACKEND_URL}/api`;

const api = axios.create({
  baseURL: API_BASE,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // LOG REQUEST
  if (process.env.NODE_ENV === 'development') {
    console.log(`🚀 [API Request] ${config.method.toUpperCase()} ${config.url}`, config.data || '');
  }
  
  return config;
});

// Handle responses and errors
api.interceptors.response.use(
  (response) => {
    // LOG SUCCESS
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ [API Response] ${response.status} ${response.config.url}`, response.data);
    }
    return response;
  },
  (error) => {
    // LOG ERROR
    if (process.env.NODE_ENV === 'development') {
      console.error(`❌ [API Error] ${error.response?.status || 'Network Error'} ${error.config?.url}`, error.response?.data || error.message);
    }

    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;