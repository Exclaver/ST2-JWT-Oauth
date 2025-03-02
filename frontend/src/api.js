import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const paymentAPI = {
  createOrder: async (planId) => {
    const response = await api.post('/api/payments/create-order/', { plan_id: planId });
    return response.data;
  },
  
  verifyPayment: async (paymentData) => {
    const response = await api.post('/api/payments/verify/', paymentData);
    return response.data;
  }
};

const TokenService = {
  getAccessToken: () => localStorage.getItem('access_token'),
  getRefreshToken: () => localStorage.getItem('refresh_token'),
  setTokens: (tokens) => {
    localStorage.setItem('access_token', tokens.access);
    localStorage.setItem('refresh_token', tokens.refresh);
  },
  clearTokens: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }
};
// Add auth interceptor
api.interceptors.request.use((config) => {
  const token = TokenService.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshResponse = await authAPI.refreshToken();
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh token failed, redirect to login
        localStorage.clear();
        window.location.href = '/login_signup';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {

  login: async (credentials) => {
    const response = await api.post('/api/auth/callback/', credentials);
    if (response.data.tokens) {
      TokenService.setTokens(response.data.tokens);
    }
    return response.data;
  },
  
  logout: async () => {
    TokenService.clearTokens();
    return { success: true };
  },

  refreshToken: async () => {
    const refresh_token = TokenService.getRefreshToken();
    if (!refresh_token) throw new Error('No refresh token available');
    
    const response = await api.post('/api/token/refresh/', {
      refresh: refresh_token
    });
    
    if (response.data.access) {
      localStorage.setItem('access_token', response.data.access);
    }
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get('/api/account/');
    return response.data;
  }
};
export const planAPI = {
  getPlans: async () => {
    const response = await api.get('/api/plans/');
    return response.data.plans;
  }
};

export default api;