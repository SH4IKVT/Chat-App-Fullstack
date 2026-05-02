import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})
export class SignupComponent {

  signupData = {
    firstName: '',
    lastName: '',
    email: '',
    password: ''
  };

  errorMsg: string = '';
  showError: boolean = false;

  constructor(
    private auth: AuthService,
    public router: Router,
    private cd: ChangeDetectorRef
  ) {}

  signup() {
    this.auth.signup(this.signupData).subscribe({
      next: (res: any) => {
        console.log("Signup success:", res);

        this.errorMsg = "Signup successful! Wait for admin approval.";
        this.showError = true;

        this.cd.detectChanges();

        setTimeout(() => {
          this.showError = false;
          this.router.navigate(['/']);
        }, 2500);
      },

      error: (err) => {
        console.error("Signup error:", err);

        if (err.status === 400) {
          this.errorMsg = err.error?.message || "User already exists";
        } else {
          this.errorMsg = "Something went wrong";
        }

        this.showError = true;
        this.cd.detectChanges();

        setTimeout(() => {
          this.showError = false;
          this.cd.detectChanges();
        }, 3000);
      }
    });
  }
}