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

  role: string = '';
  users: any[] = [];
  userEmail = '';
  loading = false;

  messages: any[] = [];   // 🔥 NEW

  constructor(
    private router: Router,
    private auth: AuthService,
    private cd: ChangeDetectorRef
  ) {
    this.role = localStorage.getItem('role') || 'User';
    this.userEmail = localStorage.getItem('email') || '';
  }

  ngOnInit() {
    this.loadUsers();
    this.loadMessages();   // 🔥 LOAD ALL MESSAGES
  }

  logout() {
    localStorage.clear();
    this.router.navigate(['/']);
  }

  loadUsers() {
    this.loading = true;

    this.auth.getUsers().subscribe({
      next: (res: any[]) => {
        this.users = [...res];
        this.loading = false;
        this.cd.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
        this.cd.detectChanges();
      }
    });
  }

  // 🔥 LOAD ALL MESSAGES FOR ADMIN
loadMessages() {
  const currentUser = this.userEmail?.toLowerCase().trim();

  this.auth.getMessages(this.userEmail, 'ALL' ).subscribe({
    next: (res: any[]) => {

      this.messages = res.map(m => ({
        ...m,
        senderEmail: m.senderEmail?.toLowerCase().trim(),
        receiverEmail: m.receiverEmail?.toLowerCase().trim(),
        formattedTime: new Date(m.createdAt).toLocaleString()
      }));

      console.log("ADMIN EMAIL:", currentUser);
      console.log("MESSAGES:", this.messages);

      this.cd.detectChanges();
    },
    error: (err) => {
      console.error("Message load error:", err);
    }
  });
}

// next: (res: any[]) => {
//   this.messages = res.map(m => ({
//     ...m,
//     formattedTime: new Date(m.createdAt).toLocaleString()
//   }));
//   this.cd.detectChanges();
approve(email: string) {
    this.auth.approve(email).subscribe(() => {
      this.loadUsers();
    });
  }

  reject(email: string) {
    this.auth.reject(email).subscribe(() => {
      this.loadUsers();
    });
  }

  messageUser(email: string) {
    localStorage.setItem('chatUser', email);
    this.router.navigate(['/chat']);
  }

  messageAll() {
    localStorage.setItem('chatUser', 'ALL');
    this.router.navigate(['/chat']);
  }
}