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
    // ✅ TAB LOCK SYSTEM
    const email =
      sessionStorage.getItem('email');

    if (email) {

      // CREATE TAB ID
      if (!sessionStorage.getItem('tabId')) {

        sessionStorage.setItem(
          'tabId',
          crypto.randomUUID()
        );

      }

      const tabId =
        sessionStorage.getItem('tabId');

      const storageKey =
        `activeTab_${email}`;

      const existingTab =
        localStorage.getItem(storageKey);

      // BLOCK SAME USER
      if (
        existingTab &&
        existingTab !== tabId
      ) {

        alert(
          'This user is already active in another tab'
        );

        sessionStorage.clear();

        this.router.navigate(['/']);

        return;
      }

      // REGISTER TAB
      localStorage.setItem(
        storageKey,
        tabId || ''
      );

      // REMOVE LOCK ON CLOSE
      window.addEventListener(
        'beforeunload',
        () => {

          const active =
            localStorage.getItem(storageKey);

          if (active === tabId) {

            localStorage.removeItem(storageKey);

          }

        }
      );

    }

    // ✅ LOAD USERS FOR MULTI SELECT
    this.auth.getUsers().subscribe({
      next: (res: any[]) => {

        this.allUsers = res.filter(u =>
          u.email.toLowerCase() !== this.userEmail
        );

        this.cd.detectChanges();
      }
    });
    // ✅ LOAD USERS
    this.loadUsers();
    // ✅ LOAD NOTICE CHAT
    this.loadNoticeMessages();

    // ✅ SIGNALR
    this.signalR.startConnection();

    this.signalR.onReceiveMessage((msg) => {

      const sender = msg.senderEmail?.toLowerCase();
      const receiver = msg.receiverEmail?.toLowerCase();
      const isAdminRelated =

        (
          sender !== this.userEmail
          &&
          receiver === this.userEmail
        );
    if (isAdminRelated) {

      // ✅ Prevent duplicate grouped admin messages
      const alreadyExists = this.noticeMessages.some(m =>

        m.text === msg.text &&

        m.senderEmail === msg.senderEmail &&

        (
          new Date(m.createdAt).getTime() ===
          new Date(msg.createdAt).getTime()
        )
      );

      if (!alreadyExists) {

        this.noticeMessages.push(msg);

        this.cd.detectChanges();

      }

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

        const filtered = res.filter(m => {

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

        // ✅ GROUP ADMIN MULTI-SEND MESSAGES
        const grouped: any[] = [];

        filtered.forEach(msg => {

          // ONLY group admin sent messages
          if (msg.senderEmail?.toLowerCase() === this.userEmail) {

            const existing = grouped.find(g =>

              g.text === msg.text &&

              Math.abs(
                new Date(g.createdAt).getTime() -
                new Date(msg.createdAt).getTime()
              ) < 2000 // within 2 seconds
            );

            if (existing) {

              existing.receiverEmail +=
                `, ${msg.receiverEmail}`;

            } else {

              grouped.push({
                ...msg,
                multiSend: true
              });

            }

          } else {

            grouped.push(msg);

          }

        });

      this.noticeMessages = grouped.sort((a, b) =>

        new Date(a.createdAt).getTime() -
        new Date(b.createdAt).getTime()

      );

        this.cd.detectChanges();
        this.scrollToBottom();
      }

    });

  }
  scrollToBottom() {

    setTimeout(() => {

      const container =
        document.getElementById('chatCard');

      if (container) {

        container.scrollTop =
          container.scrollHeight;

      }

    }, 100);

  }
  sendNoticeMessage() {

    if (!this.newNoticeMessage.trim()) return;

    const selected = this.selectedUsers.length > 0

    ? [...this.selectedUsers]

    : this.allUsers.map(u => u.email);

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

      multiSend: true,

      createdAt: new Date()

    });

    this.newNoticeMessage = '';
    this.selectedUsers = [];

    this.loadNoticeMessages();
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
        this.scrollToBottom();
      }
    });
  }

  logout() {

    const email =
      sessionStorage.getItem('email');

    if (email) {

      localStorage.removeItem(
        `activeTab_${email}`
      );

    }

    this.auth.logout();

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