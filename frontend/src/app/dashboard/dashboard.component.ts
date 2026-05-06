import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  role = '';
  users: any[] = [];
  userEmail = '';
  loading = false;
  messages: any[] = [];

  constructor(private router: Router, private auth: AuthService, private cd: ChangeDetectorRef) {
    // Read from session
    this.role = sessionStorage.getItem('role') || 'User';
    this.userEmail = (sessionStorage.getItem('email') || '').toLowerCase().trim();
  }

  ngOnInit() {
    this.loadUsers();
  }

  getUserName(email: string): string {
    if (!email) return 'Unknown';
    const cleanEmail = email.toLowerCase().trim();
    const user = this.users.find(u => u.email.toLowerCase().trim() === cleanEmail);
    return user ? user.name : email;
  }

  loadUsers() {
    this.loading = true;
    this.auth.getUsers().subscribe({
      next: (res: any[]) => {
        this.users = res;
        this.loading = false;
        this.loadMessages(); // Load messages after users to map names
        this.cd.detectChanges();
      },
      error: (err) => { console.error(err); this.loading = false; }
    });
  }

  loadMessages() {
    this.auth.getAllMessages().subscribe({
      next: (res: any[]) => {

        this.messages = res
          .filter(m => {
            const sender = m.senderEmail?.toLowerCase().trim();
            const receiver = m.receiverEmail?.toLowerCase().trim();

            // ✅ CASE 1: Messages sent TO admin (from any user)
            const receivedByAdmin = receiver === this.userEmail;

            // ✅ CASE 2: Messages sent BY admin TO ALL users
            const sentByAdminToAll =
              sender === this.userEmail && receiver === 'all';

            return receivedByAdmin || sentByAdminToAll;
          })
          .map(m => ({
            ...m,
            senderName: this.getUserName(m.senderEmail),
            receiverName: m.receiverEmail === 'all' ? 'ALL USERS' : this.getUserName(m.receiverEmail),
            formattedTime: new Date(m.createdAt).toLocaleString()
          }));

        this.cd.detectChanges();
      }
    });
  }

  logout() {
    this.auth.logout(); // Clears sessionStorage
    this.router.navigate(['/']);
  }

  messageUser(email: string) {
    sessionStorage.setItem('chatUser', email);
    this.router.navigate(['/chat']);
  }
  reject(email: string){this.auth.reject(email).subscribe(()=>{this.loadUsers()
    console.log(email+" is rejected")
  });}
  approve(email: string) { this.auth.approve(email).subscribe(() => this.loadUsers()); }
  messageAll() { sessionStorage.setItem('chatUser', 'ALL'); this.router.navigate(['/chat']); }
  goAnalyticsSection() { this.router.navigate(['/analytics']); }
}