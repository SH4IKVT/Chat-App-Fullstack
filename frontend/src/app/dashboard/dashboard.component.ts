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
  loading = false;

  constructor(
    private router: Router,
    private auth: AuthService,
    private cd: ChangeDetectorRef
  ) {
    this.role = localStorage.getItem('role') || 'User';
  }

  ngOnInit() {
    console.log("Dashboard loaded");
    this.loadUsers();
  }

  logout() {
    localStorage.clear();
    this.router.navigate(['/']);
  }

  loadUsers() {
    this.loading = true;

    this.auth.getUsers().subscribe({
      next: (res: any[]) => {
        console.log("Users:", res);

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

  // 🔥 NEW: MESSAGE SINGLE USER
  messageUser(email: string) {
    console.log("Message user:", email);

    // store selected user (for chat page later)
    localStorage.setItem('chatUser', email);

    this.router.navigate(['/chat']);
  }

  // 🔥 NEW: MESSAGE ALL USERS
  messageAll() {
    console.log("Message ALL users");

    localStorage.setItem('chatUser', 'ALL');

    this.router.navigate(['/chat']);
  }
}