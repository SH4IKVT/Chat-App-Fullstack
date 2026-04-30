import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

export interface User {
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  status: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {

  private baseUrl = 'http://localhost:5119/api/auth';

  constructor(private http: HttpClient) {}

  signup(data: any) {
    return this.http.post(`${this.baseUrl}/signup`, data);
  }

  login(data: any) {
    return this.http.post(`${this.baseUrl}/login`, data);
  }

  getUsers() {
    return this.http.get<User[]>(`${this.baseUrl}/users`);
  }

  approve(email: string) {
    return this.http.post(`${this.baseUrl}/approve`, { email });
  }

  reject(email: string) {
    return this.http.post(`${this.baseUrl}/reject`, { email });
  }

getUserByEmail(email: string) {
    // Encode email to handle special characters like '@' in the URL[cite: 3]
    const encodedEmail = encodeURIComponent(email);
    return this.http.get<any>(`${this.baseUrl}/user/${encodedEmail}`);
  }

  // 🔥 HELPER
  getToken() {
    return localStorage.getItem('token');
  }

  logout() {
    localStorage.clear();
  }
}