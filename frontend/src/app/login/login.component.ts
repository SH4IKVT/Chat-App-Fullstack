import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {

  loginData = {
    email: '',
    password: '',
    role: 'User'
  };

  errorMsg: string = '';
  loading: boolean = false;

  constructor(private auth: AuthService, private router: Router) {}

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
        console.log("Login success", res);

        this.loading = false;
        localStorage.setItem('token', res.token);

        // ✅ Store role from backend
        localStorage.setItem('role', res.role);
        localStorage.setItem('name', res.name);
        localStorage.setItem('email', res.email);

        // 🔀 Redirect based on role
        if (res.role === 'Admin') {
          this.router.navigate(['/dashboard']);
        } else {
          this.router.navigate(['/user-dashboard']); // ✅ FIXED
        }
      },
      error: (err) => {
        console.log("Login error", err);

        this.loading = false;

        this.errorMsg = err.error?.message || "Login failed";
      }
    });
  }
}