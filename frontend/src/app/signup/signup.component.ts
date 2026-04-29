import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './signup.component.html'
})
export class SignupComponent {

  user = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'User'
  };

  errorMsg: string = '';
  successMsg: string = '';

  constructor(private auth: AuthService) {}

  register() {
    this.auth.signup(this.user).subscribe({
      next: (res: any) => {
        console.log("Signup success", res);

        this.errorMsg = '';
        this.successMsg = res.message;

        // optional alert
        alert(res.message);
      },
      error: (err) => {
        console.log("Signup error", err);

        this.successMsg = '';
        this.errorMsg = err.error?.message || "Something went wrong";

        // optional alert
        alert(this.errorMsg);
      }
    });
  }
}