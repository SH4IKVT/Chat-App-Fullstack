import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';
import { Chart, registerables } from 'chart.js';
import { Router } from '@angular/router';
import { ChangeDetectorRef } from '@angular/core';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import ChartDataLabels from 'chartjs-plugin-datalabels';

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
  total = 0; approved = 0; active = 0;
  messages: any[] = [];

  constructor(private auth: AuthService, private router: Router, private cd: ChangeDetectorRef) {
    this.role = sessionStorage.getItem('role') || ''; // Read from session
  }

  ngOnInit() {
    this.loadUsers();
    this.loadMessages();
  }

  loadUsers() {
    this.auth.getUsers().subscribe({
      next: (res: any[]) => {
        this.users = res;
        this.total = res.length;
        this.approved = res.filter(u => u.status === 'approved').length;
        this.active = this.approved;
        this.cd.detectChanges();
        setTimeout(() => this.createChart(), 100);
      }
    });
  }

  createChart() {
    const existingChart = Chart.getChart('pieChart');
    if (existingChart) existingChart.destroy();
    new Chart('pieChart', {
      type: 'pie',
      data: {
        labels: ['Total Requests', 'Approved Users', 'Active Users', 'Pending Users'],
        datasets: [{
          data: [this.total, this.approved, this.active, this.total - this.approved],
          backgroundColor: ['#3b82f6', '#e2e60e', '#808080', '#ee1053']
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { labels: { color: '#ffffff' } },
          datalabels: {
            color: 'white',
            backgroundColor: (ctx) => (ctx.dataset.backgroundColor as string[])[ctx.dataIndex],
            borderRadius: 4,
            padding: 6,
            formatter: (val, ctx) => `${ctx.chart.data.labels![ctx.dataIndex]}: ${val}`
          }
        }
      }
    });
  }

  loadMessages() {
    this.auth.getAllMessages().subscribe({
      next: (res: any[]) => {
        this.messages = res.map(m => ({
          ...m,
          formattedTime: m.createdAt ? new Date(m.createdAt).toLocaleString() : 'N/A'
        }));
        this.cd.detectChanges();
        setTimeout(() => this.createMessageChart(), 100);
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
        datasets: [{ label: 'Message Stats', data: [toAdmin, fromAdmin, others], backgroundColor: ['#3b82f6', '#10b981', '#ef4444'] }]
      },
      options: { scales: { x: { ticks: { color: '#fff' } }, y: { ticks: { color: '#fff' } } } }
    });
  }

  printPDF() {
    const element = document.getElementById('userTable');
    if (!element) return;
    html2canvas(element, { backgroundColor: '#1e1e2d', scale: 2 }).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      pdf.addImage(imgData, 'PNG', 0, 0, 210, (canvas.height * 210) / canvas.width);
      pdf.save('Users.pdf');
    });
  }
printTable() {
  const table = document.getElementById('userTable');

  if (!table) return;

  const printWindow = window.open('', '', 'width=900,height=700');

  if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Print Users</title>
          <style>
            body { font-family: Arial; padding: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #000; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <h2>User Table</h2>
          ${table.outerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  }
  Back() {
    const role = sessionStorage.getItem('role');
    this.router.navigate([role === 'Admin' ? '/dashboard' : '/user-dashboard']);
  }
}