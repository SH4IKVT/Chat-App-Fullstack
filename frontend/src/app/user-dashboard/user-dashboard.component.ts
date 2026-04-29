import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-dashboard.component.html',
  styleUrls: ['./user-dashboard.component.css']
})
export class UserDashboardComponent implements OnInit {

  user: any = null;
  loading = true;
  errorMsg = '';

  constructor(private auth: AuthService, private cd: ChangeDetectorRef) {}

  ngOnInit() {
    console.log("User Dashboard loaded");

    const email = localStorage.getItem('email');
    console.log("EMAIL:", email);

    if (!email) {
      this.errorMsg = "Session expired. Please login again.";
      this.loading = false;
      this.cd.detectChanges();   // 🔥 important
      return;
    }

    this.loadUser(email);
  }

  loadUser(email: string) {
    this.loading = true;
    this.errorMsg = '';

    this.auth.getUserByEmail(email).subscribe({
      next: (res: any) => {
        console.log("USER DATA:", res);

        this.user = res;
        this.loading = false;

        this.cd.detectChanges();   // 🔥 SAME FIX AS ADMIN
      },
      error: (err) => {
        console.error("ERROR:", err);

        this.errorMsg = "Failed to load user";
        this.loading = false;

        this.cd.detectChanges();   // 🔥 ALSO HERE
      }
    });
  }
}