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
  messages: any[]=[]
  constructor(private auth: AuthService,private router: Router) {
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

    if (Chart.getChart('pieChart')) {
      Chart.getChart('pieChart')?.destroy();
    }

    const dataValues = [
      this.total,
      this.approved,
      this.active,
      this.total - this.approved
    ];

    new Chart('pieChart', {
      type: 'pie',
      data: {
        labels: ['Total Requests', 'Approved Users', 'Active Users', 'Pending Users'],
        datasets: [{
          data: dataValues,
          backgroundColor: ['#3b82f6', '#e2e60e', '#dddbd8', '#ee1053']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,

        plugins: {
          legend: {
            position: 'right',
            labels: {
              color: '#ffffff',
              padding: 20,
              font: { size: 14 },

              // 🔥 SHOW NUMBER BESIDE TEXT (CORRECT WAY)
              generateLabels: (chart) => {
                const labels = chart.data.labels || [];
                return labels.map((label: any, i: number) => ({
                  text: `${label} (${dataValues[i]})`,
                  fillStyle: chart.data.datasets[0].backgroundColor[i],
                  hidden: false,
                  index: i
                }));
              }
            }
          }
        }
      }
    });
  }
  Back() {
    console.log("Clicked to back to dashboard")
    const role = localStorage.getItem('role');

    if (role === 'Admin') {
      console.log("goin to dashboard")
      this.router.navigate(['/dashboard']);
    } else {
      this.router.navigate(['/user-dashboard']);
    }
  }
}