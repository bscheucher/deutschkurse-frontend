import api from './api';
import { LoginRequest, RegisterRequest, AuthResponse, User } from '../types/auth.types';

class AuthService {
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', data);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  }

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/register', data);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  }

  async getCurrentUser(): Promise<User> {
    const response = await api.get<User>('/auth/me');
    return response.data;
  }

  async logout(): Promise<void> {
    await api.post('/auth/logout');
    localStorage.removeItem('token');
  }

  async getAllUsers(): Promise<User[]> {
    const response = await api.get<User[]>('/auth/users');
    return response.data;
  }

  async updateUserStatus(userId: number, enabled: boolean): Promise<void> {
    await api.put(`/auth/users/${userId}/status`, { enabled });
  }

  async updateUserRole(userId: number, role: string): Promise<User> {
    const response = await api.put<User>(`/auth/users/${userId}/role`, { role });
    return response.data;
  }
}

export default new AuthService();
