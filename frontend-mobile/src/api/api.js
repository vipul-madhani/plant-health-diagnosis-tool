import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://localhost:8000'; // Update for production

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

// Request interceptor to add token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error retrieving token:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_URL}/auth/refresh`, {
            refresh_token: refreshToken,
          });
          
          const { access_token, refresh_token } = response.data;
          await AsyncStorage.setItem('accessToken', access_token);
          if (refresh_token) {
            await AsyncStorage.setItem('refreshToken', refresh_token);
          }
          
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        await AsyncStorage.removeItem('accessToken');
        await AsyncStorage.removeItem('refreshToken');
        await AsyncStorage.removeItem('user');
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// ========== AUTH API CALLS ==========
export const authAPI = {
  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      const { access_token, refresh_token, user } = response.data;
      
      await AsyncStorage.setItem('accessToken', access_token);
      await AsyncStorage.setItem('refreshToken', refresh_token);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  login: async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { access_token, refresh_token, user } = response.data;
      
      await AsyncStorage.setItem('accessToken', access_token);
      await AsyncStorage.setItem('refreshToken', refresh_token);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await AsyncStorage.removeItem('accessToken');
      await AsyncStorage.removeItem('refreshToken');
      await AsyncStorage.removeItem('user');
    }
  },

  getCurrentUser: async () => {
    try {
      const userStr = await AsyncStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      return null;
    }
  },
};

// ========== CONSULTATION API CALLS ==========
export const consultationAPI = {
  submitDiagnosis: async (diagnosisData, imageUri) => {
    try {
      const formData = new FormData();
      formData.append('plant_name', diagnosisData.plantName);
      formData.append('symptoms', diagnosisData.symptoms);
      formData.append('region', diagnosisData.region);
      formData.append('season', diagnosisData.season);
      
      if (imageUri) {
        formData.append('image', {
          uri: imageUri,
          type: 'image/jpeg',
          name: 'plant_image.jpg',
        });
      }
      
      const response = await api.post('/consultations/submit', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getConsultations: async (status = 'all', page = 1) => {
    try {
      const response = await api.get('/consultations', {
        params: { status, page, limit: 10 },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getConsultationDetails: async (consultationId) => {
    try {
      const response = await api.get(`/consultations/${consultationId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  assignConsultation: async (consultationId) => {
    try {
      const response = await api.post(
        `/consultations/${consultationId}/assign`,
        {}
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  completeConsultation: async (consultationId, summary) => {
    try {
      const response = await api.post(
        `/consultations/${consultationId}/complete`,
        { summary }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

// ========== CHAT API CALLS ==========
export const chatAPI = {
  sendMessage: async (consultationId, message) => {
    try {
      const response = await api.post(
        `/consultations/${consultationId}/messages`,
        { message }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getMessages: async (consultationId, page = 1) => {
    try {
      const response = await api.get(
        `/consultations/${consultationId}/messages`,
        { params: { page, limit: 20 } }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getUnreadCount: async (consultationId) => {
    try {
      const response = await api.get(
        `/consultations/${consultationId}/unread`
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

// ========== BLOG API CALLS ==========
export const blogAPI = {
  getBlogPosts: async (region = 'all', season = 'all', page = 1) => {
    try {
      const response = await api.get('/blog', {
        params: { region, season, page, limit: 10 },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getBlogDetail: async (postId) => {
    try {
      const response = await api.get(`/blog/${postId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  likeBlogPost: async (postId) => {
    try {
      const response = await api.post(`/blog/${postId}/like`, {});
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  commentOnBlog: async (postId, comment) => {
    try {
      const response = await api.post(`/blog/${postId}/comments`, {
        comment,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

// ========== PROFILE API CALLS ==========
export const profileAPI = {
  getProfile: async () => {
    try {
      const response = await api.get('/profile');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  updateProfile: async (profileData) => {
    try {
      const response = await api.put('/profile', profileData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getPayoutInfo: async () => {
    try {
      const response = await api.get('/profile/payout');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

// ========== UTILITY FUNCTIONS ==========
export const getWebSocketURL = () => {
  return 'ws://localhost:5000/ws'; // Update for production
};

export default api;
