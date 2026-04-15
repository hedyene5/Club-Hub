import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8888/api/auth';

  constructor(private http: HttpClient, private router: Router) {}

  login(credentials: { email: string; password: string }) {
    return this.http.post(`${this.apiUrl}/login`, credentials);
  }

  // Save user data (same key as Auth Module)
  saveUser(userData: any) {
    localStorage.setItem('user', JSON.stringify(userData));
  }

  // Get user data
  getUser(): any {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  // Check if authenticated (checks for 'user' key, not 'token')
  isAuthenticated(): boolean {
    return !!localStorage.getItem('user');
  }

  // For backward compatibility
  saveToken(token: string) {
    localStorage.setItem('token', token);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  logout() {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    window.location.href = 'http://localhost:4201';
  }
}