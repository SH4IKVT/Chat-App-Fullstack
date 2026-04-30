import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService, User } from '../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-dashboard.component.html',
  styleUrls: ['./user-dashboard.component.css']
})
export class UserDashboardComponent implements OnInit {

  user: any = null;
  users: User[] = [];
  loading = true;
  errorMsg = '';

  constructor(
    private auth: AuthService,
    private cd: ChangeDetectorRef,
    private router: Router
  ) {}

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
        console.log("USER RAW:", res);

        // 🔥 NORMALIZE DATA
        this.user = {
          name: (res.firstName || '') + ' ' + (res.lastName || ''),
          email: res.email || res.Email,
          role: res.role || res.Role,
          status: res.status || res.Status
        };

        this.loading = false;
        this.cd.detectChanges();
      },
      error: (err) => {
        console.error("User load error:", err);
        this.errorMsg = "Failed to load user";
        this.loading = false;
        this.cd.detectChanges();
      }
    });
  }

  logout() {
    localStorage.clear();
    this.router.navigate(['/']);
  }

  loadAllUsers(currentEmail: string) {
    this.auth.getUsers().subscribe({
      next: (res: User[]) => {
        // backend returns { name, email, ... }
        this.users = res.filter(u => u.email !== currentEmail);
        this.cd.detectChanges();
      },
      error: (err) => {
        console.error("User list error:", err);
      }
    });
  }

  // 🔥 FIXED: use `name` directly (not firstName/lastName)
  messageUser(user: User) {
    localStorage.setItem('chatUser', user.email);
    localStorage.setItem('chatUserName', user.name || user.email);

    this.router.navigate(['/chat']);
  }
}