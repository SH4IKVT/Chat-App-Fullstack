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

  broadcastMessages: any[] = [];
  unreadAdminMessage: any = null;

  admin: User = {
    name: 'ADMIN USER',
    firstName: 'ADMIN',
    lastName: 'USER',
    email: 'admin@gmail.com',
    role: 'Admin',
    status: 'approved'
  };

  constructor(
    private auth: AuthService,
    private cd: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit() {
    // ✅ FIX: use sessionStorage
    const email = sessionStorage.getItem('email');

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

        this.user = {
          name: (res.firstName || '') + ' ' + (res.lastName || ''),
          email: res.email || res.Email,
          role: res.role || res.Role,
          status: (res.status || res.Status || '').toUpperCase()
        };

        this.loadMessages();

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

  // 🔥 LOAD MESSAGES
  loadMessages() {
    const email = this.user.email;

    this.auth.getMessages(email, 'admin@gmail.com').subscribe({
      next: (res: any[]) => {

        // ✅ broadcast messages
        this.broadcastMessages = res
          .filter(m => m.receiverEmail?.toLowerCase() === 'all')
          .slice(-4);

        // ✅ personal admin message
        const personal = res.find(m =>
          m.senderEmail?.toLowerCase() === 'admin@gmail.com' &&
          m.receiverEmail?.toLowerCase() === email.toLowerCase()
        );

        this.unreadAdminMessage = personal || null;

        this.cd.detectChanges();
      },
      error: (err) => {
        console.error("Message load error", err);
      }
    });
  }

  logout() {
    // ✅ FIX: keep consistent
    sessionStorage.clear();
    this.router.navigate(['/']);
  }

  // 🔥 FIXED USER LIST
  loadAllUsers(currentEmail: string) {
    this.auth.getUsers().subscribe({
      next: (res: User[]) => {

        this.users = res
          .filter(u => u.email.toLowerCase() !== currentEmail.toLowerCase())
          .map(u => ({
            ...u,
            name: u.name || (u.firstName + ' ' + u.lastName)
          }));

        this.cd.detectChanges();
      },
      error: (err) => {
        console.error("User list error:", err);
      }
    });
  }

  messageUser(user: User) {
    // ✅ FIX: use sessionStorage
    sessionStorage.setItem('chatUser', user.email);
    sessionStorage.setItem('chatUserName', user.name || user.email);

    this.router.navigate(['/chat']);
  }
}