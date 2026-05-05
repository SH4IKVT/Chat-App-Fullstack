import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';
import { Chart, registerables } from 'chart.js';
import { Router } from '@angular/router';
import { ChangeDetectorRef } from '@angular/core';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
// Import the datalabels plugin
import ChartDataLabels from 'chartjs-plugin-datalabels';

// Register the plugin globally
Chart.register(ChartDataLabels, ...registerables);

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
  messages: any[] = [];

  constructor(private auth: AuthService, private router: Router, private cd: ChangeDetectorRef) {
    this.role = localStorage.getItem('role') || '';
  }

  ngOnInit() {
    setTimeout(() => {
      this.loadUsers();
      this.loadMessages();
    }, 100);
  }

  loadUsers() {
    this.auth.getUsers().subscribe({
      next: (res: any[]) => {
        this.users = res;
        this.total = res.length;
        this.approved = res.filter(u => u.status === 'approved').length;
        this.active = res.filter(u => u.status === 'approved').length;
        this.cd.detectChanges();
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
    setTimeout(() => {
      const existingChart = Chart.getChart('pieChart');
      if (existingChart) {
        existingChart.destroy();
      }

      const dataValues = [
        this.total,
        this.approved,
        this.active,
        this.total - this.approved
      ];

      const backgroundColors = ['#3b82f6', '#e2e60e', '#808080', '#ee1053'];

      new Chart('pieChart', {
        type: 'pie',
        data: {
          labels: ['Total Requests', 'Approved Users', 'Active Users', 'Pending Users'],
          datasets: [{
            data: dataValues,
            backgroundColor: backgroundColors
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top', // Moved to top
              labels: {
                color: '#ffffff',
                padding: 15
              }
            },
            // Configuration for labels on top of the chart
            datalabels: {
              color: 'white', // Font color
              anchor: 'center', // Position relative to the slice
              align: 'center',
              backgroundColor: (context) => {
                // Returns the same color as the slice for the box background
                return context.dataset.backgroundColor ? (context.dataset.backgroundColor as string[])[context.dataIndex] : '#000';
              },
              borderRadius: 4, // Makes it look like a box
              padding: 6,
              font: {
                weight: 'bold',
                size: 12
              },
              formatter: (value, context) => {
                // Shows the Label + Value inside the box
                const label = context.chart.data.labels ? context.chart.data.labels[context.dataIndex] : '';
                return `${label}: ${value}`;
              }
            }
          }
        }
      });
    }, 150);
  }

  // ... rest of your methods (loadMessages, createMessageChart, printPDF, Back) remain the same
  
  loadMessages() {
    this.auth.getAllMessages().subscribe({
      next: (res: any[]) => {
        this.messages = res.map(m => ({
          ...m,
          formattedTime: m.createdAt ? new Date(m.createdAt).toLocaleString() : 'N/A'
        }));
        this.cd.detectChanges();
        setTimeout(() => {
          this.createMessageChart();
        }, 100);
      },
      error: (err) => {
        console.error("Message load error", err);
      }
    });
  }

  createMessageChart() {
    const existing = Chart.getChart('messageChart');
    if (existing) existing.destroy();
    const adminEmail = 'admin@gmail.com';
    let toAdmin = 0, fromAdmin = 0, others = 0;

    this.messages.forEach(m => {
      if (m.receiverEmail === adminEmail) toAdmin++;
      else if (m.senderEmail === adminEmail) fromAdmin++;
      else others++;
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
          legend: { labels: { color: '#ffffff' } },
          datalabels: { display: false } // Disable datalabels for bar chart if preferred
        },
        scales: {
          x: { ticks: { color: '#ffffff' } },
          y: { ticks: { color: '#ffffff' } }
        }
      }
    });
  }

  printPDF() {
    const element = document.getElementById('userTable');
    if (!element) return;
    html2canvas(element, {
      backgroundColor: '#1e1e2d',
      scale: 2,
      useCORS: true
    }).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save('Users.pdf');
    });
  }

  Back() {
    const role = localStorage.getItem('role');
    this.router.navigate([role === 'Admin' ? '/dashboard' : '/user-dashboard']);
  }
}