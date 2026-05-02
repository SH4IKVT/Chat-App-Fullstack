import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';
import { Chart, registerables } from 'chart.js';
import { Router } from '@angular/router';

Chart.register(...registerables);

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.css']
})
export class AnalyticsComponent implements OnInit {

  role = '';
  users: any[] = [];

  total = 0;
  approved = 0;
  active = 0;
  router: any;

  constructor(private auth: AuthService) {
    this.role = localStorage.getItem('role') || '';
  }

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.auth.getUsers().subscribe({
      next: (res: any[]) => {
        this.users = res;

        this.total = res.length;
        this.approved = res.filter(u => u.status === 'approved').length;

        // 🔥 SIMPLE ACTIVE LOGIC (you can improve later)
        this.active = res.filter(u => u.status === 'approved').length;

      setTimeout(() => {
        this.createChart();
      }, 100);
      },
      error: (err) => {
        console.error("Analytics load error", err);
      }
    });
  }

  createChart() {
    new Chart('pieChart', {
      type: 'pie',
      data: {
        labels: ['Total Requests', 'Approved Users', 'Active Users'],
        datasets: [{
          data: [this.total, this.approved, this.active],
          backgroundColor: ['#3b82f6', '#10b981', '#f59e0b']
        }]
      },
      options: {
        plugins: {
          legend: {
            position: 'right',
            labels: {
              color: '#ffffff',   // 🔥 WHITE TEXT
              padding: 20,
              font: {
                size: 14
              }
            }
          }
        }
      }
    });
  }
  goToBack() {
    localStorage.removeItem('chatUser');
    localStorage.removeItem('chatUserName');

    const role = localStorage.getItem('role');

    if (role === 'Admin') {
      this.router.navigate(['/dashboard']);
    } else {
      this.router.navigate(['/user-dashboard']);
    }
  }
}