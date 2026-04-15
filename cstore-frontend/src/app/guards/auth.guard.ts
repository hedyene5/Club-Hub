import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private router: Router) {}

  canActivate(): boolean {
    // Check for 'user' key (same as Auth Module)
    const user = localStorage.getItem('user');
    
    if (user) {
      return true; // User is authenticated
    }
    
    // Redirect to Auth Module login page
    window.location.href = 'http://localhost:4201';
    return false;
  }
}