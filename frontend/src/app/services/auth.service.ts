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
  private msgUrl = 'http://localhost:5119/api/messages';

  constructor(private http: HttpClient) {}

  signup(data: any) { return this.http.post(`${this.baseUrl}/signup`, data); }
  login(data: any) { return this.http.post(`${this.baseUrl}/login`, data); }
  getUsers() { return this.http.get<User[]>(`${this.baseUrl}/users`); }
  approve(email: string) { return this.http.post(`${this.baseUrl}/approve`, { email }); }
  reject(email: string) { return this.http.post(`${this.baseUrl}/reject`, { email }); }

  getUserByEmail(email: string) {
    const encodedEmail = encodeURIComponent(email);
    return this.http.get<any>(`${this.baseUrl}/user/${encodedEmail}`);
  }

  getMessages(user1: string, user2: string) {
    return this.http.get<any[]>(`${this.msgUrl}/${user1}/${user2}`);
  }

  getAllMessages() {
    return this.http.get<any[]>(`${this.msgUrl}/all`);
  }

  // FIXED: Pull from sessionStorage for tab isolation
  getToken() {
    return sessionStorage.getItem('token');
  }

  logout() {
    sessionStorage.clear(); // Clears only this tab's session
  }
}