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
    setTimeout(()=>{
      this.loadUsers();
      this.loadMessages();   // 🔥 ADD THIS
    },100)
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
  createMessageChart() {

    const existing = Chart.getChart('messageChart');
    if (existing) existing.destroy();

    const adminEmail = 'admin@gmail.com';

    let toAdmin = 0;
    let fromAdmin = 0;
    let others = 0;

    this.messages.forEach(m => {
      if (m.receiverEmail === adminEmail) {
        toAdmin++;
      } else if (m.senderEmail === adminEmail) {
        fromAdmin++;
      } else {
        others++;
      }
    });

    new Chart('messageChart', {
      type: 'bar',
      data: {
        labels: ['To Admin', 'From Admin', 'Others'],
        datasets: [{
          label: 'Message Stats',
          data: [toAdmin, fromAdmin, others],
          backgroundColor: ['#3b82f6', '#10b981', '#ef4444']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: '#ffffff' }
          }
        },
        scales: {
          x: {
            ticks: { color: '#ffffff' }
          },
          y: {
            ticks: { color: '#ffffff' }
          }
        }
      }
    });
  }
  createChart() {

    setTimeout(() => {

      const existingChart = Chart.getChart('pieChart');
      if (existingChart) {
        existingChart.destroy();   // 🔥 prevents duplicate crash
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
              position: 'bottom',
              labels: {
                color: '#ffffff',
                padding: 15,
                generateLabels: (chart) => {
                  const labels = chart.data.labels || [];
                  const dataset = chart.data.datasets[0];
                  const colors = dataset.backgroundColor as string[];

                  return labels.map((label: any, i: number) => ({
                    text: `${label} (${dataset.data[i]})`,
                    fillStyle: colors[i],
                    color: "white",
                    hidden: false,
                    index: i
                  }));
                }
              }
            }
          }
        }
      });

    }, 150);   // 🔥 ensures DOM ready
  }
  loadMessages() {
    this.auth.getAllMessages().subscribe({
      next: (res: any[]) => {

        this.messages = res.map(m => ({
          ...m,
          formattedTime: new Date(m.createdAt).toLocaleString()
        }));

        this.cd.detectChanges();

        // 🔥 ADD THIS
        setTimeout(() => {
          this.createMessageChart();
        }, 100);

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