import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService, User } from '../services/auth.service';
import { Router } from '@angular/router';  // 👈 ADD
@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-dashboard.component.html',
  styleUrls: ['./user-dashboard.component.css']
})
export class UserDashboardComponent implements OnInit {

  user: any = null;
  users: User[] = [];   // 🔥 typed properly
  loading = true;
  errorMsg = '';

  constructor(private auth: AuthService, private cd: ChangeDetectorRef,private router: Router) {}

  ngOnInit() {
    const email = localStorage.getItem('email');

    if (!email) {
      this.errorMsg = "Session expired. Please login again.";
      this.loading = false;
      this.cd.detectChanges();
      return;
    }

    this.loadUser(email);
    this.loadAllUsers(email);
  }

  loadUser(email: string) {
    this.auth.getUserByEmail(email).subscribe({
      next: (res: any) => {
        this.user = res;
        this.loading = false;
        this.cd.detectChanges();
      },
      error: () => {
        this.errorMsg = "Failed to load user";
        this.loading = false;
        this.cd.detectChanges();
      }
    });
  }
  logout() {
    localStorage.clear();   // 🔥 remove user session
    this.router.navigate(['/']);  // 🔥 go to login page
  }
  // 🔥 FIXED METHOD
  loadAllUsers(currentEmail: string) {
    this.auth.getUsers().subscribe({
      next: (res) => {
        console.log("ALL USERS:", res);

        // 🔥 now TypeScript knows res is User[]
        this.users = res.filter(u => u.email !== currentEmail);

        this.cd.detectChanges();
      },
      error: (err) => {
        console.error("User list error:", err);
      }
    });
  }

  messageUser(email: string) {
   console.log("Message user:", email);

    // store selected user (for chat page later)
    localStorage.setItem('chatUser', email);

    this.router.navigate(['/chat']);
  }
}