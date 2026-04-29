import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

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

  getUsers() {
    return this.http.get(`${this.baseUrl}/users`);
  }

  approve(email: string) {
    return this.http.post(`${this.baseUrl}/approve`, { email });
  }

  reject(email: string) {
    return this.http.post(`${this.baseUrl}/reject`, { email });
  }

  // 🔥 FIXED METHOD
  getUserByEmail(email: string) {
    const encodedEmail = encodeURIComponent(email);
    return this.http.get(`${this.baseUrl}/user/${encodedEmail}`);
  }
}