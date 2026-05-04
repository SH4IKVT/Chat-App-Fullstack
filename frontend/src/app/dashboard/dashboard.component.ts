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
    this.loadMessages();

    setInterval(() => {
      this.loadUsers();
      this.loadMessages();
    }, 20000);   // 🔥 every 5 sec
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

        setTimeout(() => {
          this.createBarChart();   // 🔥 ADD THIS
        }, 100);

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
//for column charts 
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
        datasets: [{
          label: 'User Statistics',
          data: [total, approved, pending]
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            labels: { color: '#fff' }
          }
        },
        scales: {
          x: { ticks: { color: '#fff' } },
          y: { ticks: { color: '#fff' } }
        }
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
  goAnalyticsSection(){
    this.router.navigate(['/analytics'])
  }
}