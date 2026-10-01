import api from './api';

export const authService = {
  /**
   * Register a new user account
   * @param {{ name, email, password }} credentials
   */
  async register({ name, email, password }) {
    const response = await api.post('/auth/register', { name, email, password });
    return response.data;
  },

  /**
   * Authenticate existing user credentials
   * @param {{ email, password }} credentials
   */
  async login({ email, password }) {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  /**
   * Fetch current authenticated user profile
   */
  async getMe() {
    const response = await api.get('/auth/me');
    return response.data;
  },
};