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

  // ✅ FIXED ADMIN OBJECT (NOW HAS name)
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

        this.user = {
          name: (res.firstName || '') + ' ' + (res.lastName || ''),
          email: res.email || res.Email,
          role: res.role || res.Role,
          status: res.status?.toUpperCase() || res.Status?.toUpperCase()
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
        // const Allbroadcasts = res.filter(m => m.receiverEmail === 'ALL');
        // console.log("All Broadcast Messages:", Allbroadcasts);
        // const extractedmsg = Allbroadcasts.slice(-4);
        // console.log("Extracted Broadcast Messages for Notice Board:", extractedmsg);
        // const messageTimestamps = extractedmsg.map(m => m.createdAt);
        // console.log("Timestamps of Extracted Messages:", messageTimestamps);
        // // ✅ NOTICE BOARD
        // const reverse = extractedmsg.reverse();
        // console.log("Reverse Sorted Broadcast Messages:", reverse);
        this.broadcastMessages = res.filter(m => m.receiverEmail === 'ALL');
        // how to get top 4 messages for notice board?
        
        if (this.broadcastMessages.length > 4) {
          this.broadcastMessages = this.broadcastMessages.slice(-4); // Get the last 4 messages
        }
        console.log("the good time format messages for notice board:", this.broadcastMessages);
        // ✅ PERSONAL MESSAGE
        const personal = res.find(m =>
          m.senderEmail === 'admin@gmail.com' &&
          m.receiverEmail === email
        );

        if (personal) {
          this.unreadAdminMessage = personal;
        }

        this.cd.detectChanges();
      },
      error: (err) => {
        console.error("Message load error", err);
      }
    });
  }

  logout() {
    localStorage.clear();
    this.router.navigate(['/']);
  }

  // 🔥 FIXED USER LIST (NORMALIZATION)
  loadAllUsers(currentEmail: string) {
    this.auth.getUsers().subscribe({
      next: (res: User[]) => {

        this.users = res
          .filter(u => u.email !== currentEmail)
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
    localStorage.setItem('chatUser', user.email);
    localStorage.setItem('chatUserName', user.name || user.email);
    this.router.navigate(['/chat']);
  }
}