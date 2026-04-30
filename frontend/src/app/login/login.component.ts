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
  showError: boolean = false;
  showSuccess: boolean = false;
  loginData = {
    email: '',
    password: '',
    role: 'User'
  };
  successMsg: string = '';
  errorMsg: string = '';
  loading: boolean = false;

  constructor(private auth: AuthService, public router: Router,private cd: ChangeDetectorRef) {}

  login() {

    // 🔹 Reset error
    this.errorMsg = '';

    // 🔹 Basic validation
    if (!this.loginData.email || !this.loginData.password) {
      this.errorMsg = "Please enter email and password";
      return;
    }

    this.loading = true;

    this.auth.login(this.loginData).subscribe({
      next: (res: any) => {
        console.log("Login success:", res);
        this.showSuccess = true;
        this.successMsg = "Login successful!";
        localStorage.setItem('token', res.token);
        localStorage.setItem('sessionId', res.sessionId);
        localStorage.setItem('email', res.email);
        localStorage.setItem('role', res.role);
        this.showSuccess = true;

         // 🔥 FORCE UI UPDATE
        this.cd.detectChanges();
        setTimeout(() => {
          this.showSuccess = false;     
          this.showError = false;
          this.cd.detectChanges();
        }, 5000);
        if (res.role === 'Admin') {
          this.router.navigate(['/dashboard']);
        } else {
          this.router.navigate(['/user-dashboard']);
        }
      },

    error: (err) => {
      if (err.status === 401) {
        this.errorMsg = "Invalid email or password";
      } else if (err.status === 400) {
        this.errorMsg = err.error?.message || "User not approved yet";
      } else {
        this.errorMsg = "Something went wrong";
      }

      this.showError = true;
      this.showSuccess = false;
      console.log("SHOW ERROR:", this.showError, this.errorMsg);
      // 🔥 FORCE UI UPDATE
      this.cd.detectChanges();

      setTimeout(() => {
        this.showError = false;
        this.showSuccess = false;     
        this.cd.detectChanges();
      }, 5000);
    }
    });
  }
}