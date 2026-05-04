import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';
import { Chart, registerables } from 'chart.js';
import { Router } from '@angular/router';
import { ChangeDetectorRef } from '@angular/core';


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
  messages: any[]=[];
  constructor(private auth: AuthService, private router: Router, private cd: ChangeDetectorRef) {

    this.role = localStorage.getItem('role') || '';
  }

  ngOnInit() {
    this.loadUsers();
    this.loadMessages();   // 🔥 ADD THIS
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
                const dataset = chart.data.datasets[0];

                const bgColors = dataset.backgroundColor as string[]; // 🔥 FIX

                return labels.map((label: any, i: number) => ({
                  text: `${label} (${dataset.data[i]})`,
                  fillStyle: bgColors[i],   // ✅ now safe
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
  loadMessages() {
    this.auth.getAllMessages().subscribe({
      next: (res: any[]) => {
        console.log("API DATA:", res);   // 🔥 MUST SEE DATA HERE

        this.messages = res.map(m => ({
          ...m,
          formattedTime: new Date(m.createdAt).toLocaleString()
        }));

        console.log("PROCESSED:", this.messages); // 🔥 CHECK THIS
      },
      error: (err) => {
        console.error("Message load error", err);
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