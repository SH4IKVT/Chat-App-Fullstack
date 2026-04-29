import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

// 🔥 OPTIONAL BUT CLEAN
export interface User {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  status: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(private http: HttpClient) {}

  private baseUrl = 'http://localhost:5119/api/auth';

  signup(data: any) {
    return this.http.post(`${this.baseUrl}/signup`, data);
  }

  login(data: any) {
    return this.http.post(`${this.baseUrl}/login`, data);
  }

  // 🔥 FIXED TYPE
  getUsers() {
    return this.http.get<User[]>(`${this.baseUrl}/users`);
  }

  approve(email: string) {
    return this.http.post(`${this.baseUrl}/approve`, { email });
  }

  reject(email: string) {
    return this.http.post(`${this.baseUrl}/reject`, { email });
  }

  // 🔥 KEEP THIS
  getUserByEmail(email: string) {
    const encodedEmail = encodeURIComponent(email);
    return this.http.get<any>(`${this.baseUrl}/user/${encodedEmail}`);
  }
}