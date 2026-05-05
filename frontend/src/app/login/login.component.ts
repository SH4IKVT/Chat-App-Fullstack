import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  showError = false;
  showSuccess = false;
  loginData = { email: '', password: '', role: 'User' };
  successMsg = '';
  errorMsg = '';
  loading = false;

  constructor(private auth: AuthService, public router: Router, private cd: ChangeDetectorRef) {}

  login() {
    this.errorMsg = '';
    if (!this.loginData.email || !this.loginData.password) {
      this.errorMsg = "Please enter email and password";
      return;
    }

    this.loading = true;
    this.auth.login(this.loginData).subscribe({
      next: (res: any) => {
        this.showSuccess = true;
        this.successMsg = "Login successful!";
        
        // FIXED: Using sessionStorage instead of localStorage
        sessionStorage.setItem('token', res.token);
        sessionStorage.setItem('sessionId', res.sessionId);
        sessionStorage.setItem('email', res.email);
        sessionStorage.setItem('role', res.role);

        this.cd.detectChanges();
        setTimeout(() => {
          if (res.role === 'Admin') {
            this.router.navigate(['/dashboard']);
          } else {
            this.router.navigate(['/user-dashboard']);
          }
        }, 1000);
      },
      error: (err) => {
        this.loading = false;
        this.errorMsg = err.status === 400 ? (err.error?.message || "User not approved yet") : "Invalid credentials";
        this.showError = true;
        this.cd.detectChanges();
      }
    });
  }
}