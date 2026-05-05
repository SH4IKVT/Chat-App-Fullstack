import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ChangeDetectorRef } from '@angular/core';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

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
  messages: any[] = [];

  constructor(
    private router: Router,
    private auth: AuthService,
    private cd: ChangeDetectorRef
  ) {
    this.role = localStorage.getItem('role') || 'User';
    this.userEmail = (localStorage.getItem('email') || '').toLowerCase().trim();
  }

  ngOnInit() {
    this.loadUsers(); // This will trigger loadMessages automatically
  }

  // Helper to find a user's name by their email
  getUserName(email: string): string {
    if (!email) return 'Unknown';
    const cleanEmail = email.toLowerCase().trim();
    if (cleanEmail === 'all') return 'All Users';
    
    const user = this.users.find(u => u.email.toLowerCase().trim() === cleanEmail);
    return user ? user.name : email; // Fallback to email if name isn't found
  }

  loadUsers() {
    this.loading = true;
    this.auth.getUsers().subscribe({
      next: (res: any[]) => {
        this.users = [...res];
        this.loading = false;
        
        // After users are loaded, we can fetch messages and map their names
        this.loadMessages();
        
        setTimeout(() => { this.createBarChart(); }, 100);
        this.cd.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
      }
    });
  }

  loadMessages() {
    const adminEmail = this.userEmail;

    this.auth.getAllMessages().subscribe({
      next: (res: any[]) => {
        this.messages = res
          .filter(m => {
            const sender = m.senderEmail?.toLowerCase().trim();
            const receiver = m.receiverEmail?.toLowerCase().trim();
            
            // 1. Admin sent to ALL
            const isAdminBroadcast = (sender === adminEmail && receiver === 'all');
            // 2. Someone sent to Admin
            const isSentToAdmin = (receiver === adminEmail);
            
            return isAdminBroadcast || isSentToAdmin;
          })
          .map(m => ({
            ...m,
            // Map emails to Names for the UI
            senderName: this.getUserName(m.senderEmail),
            receiverName: this.getUserName(m.receiverEmail),
            formattedTime: new Date(m.createdAt).toLocaleString()
          }));

        this.cd.detectChanges();
      },
      error: (err) => {
        console.error("Notice Board load error:", err);
      }
    });
  }

  // ... createBarChart, logout, approve, reject, messageUser, messageAll, goAnalyticsSection remain the same as your source
  
  createBarChart() {
    const existing = Chart.getChart('barChart');
    if (existing) existing.destroy();
    const total = this.users.length;
    const approved = this.users.filter(u => u.status === 'approved').length;
    const pending = this.users.filter(u => u.status === 'pending').length;
    new Chart('barChart', {
      type: 'bar',
      data: {
        labels: ['Total Users', 'Approved', 'Pending'],
        datasets: [{ label: 'User Statistics', data: [total, approved, pending] }]
      },
      options: {
        responsive: true,
        plugins: { legend: { labels: { color: '#fff' } } },
        scales: { x: { ticks: { color: '#fff' } }, y: { ticks: { color: '#fff' } } }
      }
    });
  }

  logout() { localStorage.clear(); this.router.navigate(['/']); }
  approve(email: string) { this.auth.approve(email).subscribe(() => this.loadUsers()); }
  reject(email: string) { this.auth.reject(email).subscribe(() => this.loadUsers()); }
  messageUser(email: string) { localStorage.setItem('chatUser', email); this.router.navigate(['/chat']); }
  messageAll() { localStorage.setItem('chatUser', 'ALL'); this.router.navigate(['/chat']); }
  goAnalyticsSection() { this.router.navigate(['/analytics']); }
}