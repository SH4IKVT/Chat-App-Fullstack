import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
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
export class UserDashboardComponent implements OnInit, OnDestroy {
  private refreshInterval: any;
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

    const email = sessionStorage.getItem('email');

    if (!email) {
      this.errorMsg = "Session expired. Please login again.";
      this.loading = false;
      this.cd.detectChanges();
      return;
    }

    this.loadUser(email);
    this.loadAllUsers(email);

    // ✅ AUTO REFRESH ANNOUNCEMENTS
    this.refreshInterval = setInterval(() => {

      if (this.user) {
        this.loadMessages();
      }

    }, 3000); // every 3 seconds
  }
  ngOnDestroy() {

    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }

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

  const email = this.user.email.toLowerCase();

  // ✅ Get ALL messages
  this.auth.getAllMessages().subscribe({
    next: (res: any[]) => {

      // ✅ NOTICE BOARD
      // Admin -> ALL only
      this.broadcastMessages = res
        .filter(m =>
          m.senderEmail?.toLowerCase() === 'admin@gmail.com' &&
          m.receiverEmail?.toLowerCase() === 'all'
        )
        .map(m => ({
          ...m,
          formattedTime: new Date(m.createdAt).toLocaleString()
        }))
        .sort((a, b) =>
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime()
        )
        .slice(0, 4);
      // ✅ PERSONAL ADMIN MESSAGE
      const personalMessages = res.filter(m =>
        m.senderEmail?.toLowerCase() === 'admin@gmail.com' &&
        m.receiverEmail?.toLowerCase() === email
      );

      this.unreadAdminMessage =
        personalMessages.length > 0
          ? personalMessages[personalMessages.length - 1]
          : null;
      console.log(this.broadcastMessages)
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