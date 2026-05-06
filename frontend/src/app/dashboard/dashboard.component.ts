import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { SignalrService } from '../services/signalr.service';
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  role = '';
  users: any[] = [];
  userEmail = '';
  loading = false;
  messages: any[] = [];
  activeTab: string = 'users';
  private API = 'http://localhost:5119';

  noticeMessages: any[] = [];
  newNoticeMessage = '';

  selectedUsers: string[] = [];
  allUsers: any[] = [];

  showUserSelector = false;

  constructor(
    private router: Router,
    private auth: AuthService,
    private cd: ChangeDetectorRef,
    private http: HttpClient,
    private signalR: SignalrService
  ) {
    this.role = sessionStorage.getItem('role') || 'User';
    this.userEmail =
      (sessionStorage.getItem('email') || '')
      .toLowerCase()
      .trim();
  }

  ngOnInit() {

    this.loadUsers();

    // ✅ LOAD USERS FOR MULTI SELECT
    this.auth.getUsers().subscribe({
      next: (res: any[]) => {

        this.allUsers = res.filter(u =>
          u.email.toLowerCase() !== this.userEmail
        );

        this.cd.detectChanges();
      }
    });

    // ✅ LOAD NOTICE CHAT
    this.loadNoticeMessages();

    // ✅ SIGNALR
    this.signalR.startConnection();

    this.signalR.onReceiveMessage((msg) => {

      const sender = msg.senderEmail?.toLowerCase();
      const receiver = msg.receiverEmail?.toLowerCase();

      const isAdminRelated =

        sender === this.userEmail
        ||
        receiver === this.userEmail;

      if (isAdminRelated) {

        this.noticeMessages.push(msg);

        this.cd.detectChanges();
      }

    });

  }
  setTab(tab: string) {
    this.activeTab = tab;
  }
  toggleUserSelector() {
    this.showUserSelector = !this.showUserSelector;
  }

  toggleUser(email: string, checked: boolean) {

    if (checked) {

      if (!this.selectedUsers.includes(email)) {
        this.selectedUsers.push(email);
      }

    } else {

      this.selectedUsers =
        this.selectedUsers.filter(x => x !== email);

    }

  }
  private getAuthHeaders(): HttpHeaders {

    const token = sessionStorage.getItem('token');

    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

  }

  getUserName(email: string): string {
    if (!email) return 'Unknown';
    const cleanEmail = email.toLowerCase().trim();
    const user = this.users.find(u => u.email.toLowerCase().trim() === cleanEmail);
    return user ? user.name : email;
  }

  loadUsers() {
    this.loading = true;
    this.auth.getUsers().subscribe({
      next: (res: any[]) => {
        this.users = res;
        this.loading = false;
        this.loadMessages(); // Load messages after users to map names
        this.cd.detectChanges();
      },
      error: (err) => { console.error(err); this.loading = false; }
    });
  }
  loadNoticeMessages() {

    this.http.get<any[]>(
      `${this.API}/api/messages/all`,
      { headers: this.getAuthHeaders() }
    ).subscribe({

      next: (res) => {

        this.noticeMessages = res.filter(m => {

          const sender =
            m.senderEmail?.toLowerCase();

          const receiver =
            m.receiverEmail?.toLowerCase();

          return (
            sender === this.userEmail
            ||
            receiver === this.userEmail
          );

        });

        this.cd.detectChanges();
      }

    });

  }
  sendNoticeMessage() {

    if (!this.newNoticeMessage.trim()) return;

    if (this.selectedUsers.length === 0) return;

    const selected = [...this.selectedUsers];

    selected.forEach(email => {

      const payload = {
        senderEmail: this.userEmail,
        receiverEmail: email,
        text: this.newNoticeMessage
      };

      this.http.post(
        `${this.API}/api/messages/send`,
        payload,
        { headers: this.getAuthHeaders() }
      ).subscribe();

    });

    this.noticeMessages.push({
      senderEmail: this.userEmail,
      receiverEmail: selected.join(', '),
      text: this.newNoticeMessage,
      multiSend: true
    });

    this.newNoticeMessage = '';
    this.selectedUsers = [];

    this.cd.detectChanges();

  }
  loadMessages() {
    this.auth.getAllMessages().subscribe({
      next: (res: any[]) => {

        this.messages = res
          .filter(m => {
            const sender = m.senderEmail?.toLowerCase().trim();
            const receiver = m.receiverEmail?.toLowerCase().trim();

            // ✅ CASE 1: Messages sent TO admin (from any user)
            const receivedByAdmin = receiver === this.userEmail;

            // ✅ CASE 2: Messages sent BY admin TO ALL users
            const sentByAdminToAll =
              sender === this.userEmail && receiver === 'all';

            return receivedByAdmin || sentByAdminToAll;
          })
          .map(m => ({
            ...m,
            senderName: this.getUserName(m.senderEmail),
            receiverName: m.receiverEmail === 'all' ? 'ALL USERS' : this.getUserName(m.receiverEmail),
            formattedTime: new Date(m.createdAt).toLocaleString()
          }));

        this.cd.detectChanges();
      }
    });
  }

  logout() {
    this.auth.logout(); // Clears sessionStorage
    this.router.navigate(['/']);
  }

  messageUser(email: string) {
    sessionStorage.setItem('chatUser', email);
    this.router.navigate(['/chat']);
  }
  reject(email: string){this.auth.reject(email).subscribe(()=>{this.loadUsers()
    console.log(email+" is rejected")
  });}
  approve(email: string) { this.auth.approve(email).subscribe(() => this.loadUsers()); }
  messageAll() { sessionStorage.setItem('chatUser', 'ALL'); this.router.navigate(['/chat']); }
  goAnalyticsSection() { this.router.navigate(['/analytics']); }
}