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

  constructor(private router: Router, private auth: AuthService,private cd: ChangeDetectorRef) {
    this.role = localStorage.getItem('role') || 'User';
  }

  ngOnInit() {
    console.log("Dashboard loaded");
    this.loadUsers();
  }

  loadUsers() {
    console.log("Calling API...");

    this.loading = true;

    this.auth.getUsers().subscribe({
      next: (res: any) => {
        console.log("Users:", res);

        this.users = [...res];
        this.loading = false;

        this.cd.detectChanges();   // 👈 FORCE UI UPDATE
      },
      error: (err) => {
        console.error(err);
        this.loading = false;

        this.cd.detectChanges();   // 👈 ALSO HERE
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

  goToChat() {
    this.router.navigate(['/chat']);
  }
}