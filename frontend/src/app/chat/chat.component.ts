import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit {

  private API = 'http://localhost:5119';

  messages: any[] = [];
  newMessage: string = '';

  myEmail: string = '';
  otherEmail: string = '';
  chatUserName: string = '';

  constructor(
    private cd: ChangeDetectorRef,
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit() {
    // ✅ Use sessionStorage everywhere
    this.myEmail = sessionStorage.getItem('email') || '';
    this.otherEmail = sessionStorage.getItem('chatUser') || '';

    if (!this.otherEmail) {
      console.error("No chat user found");
      return;
    }

    // ✅ FIX: Handle "ALL" properly
    if (this.otherEmail === 'ALL') {
      this.chatUserName = 'ALL USERS';
    } else {
      this.http.get<any>(`${this.API}/api/auth/user/${encodeURIComponent(this.otherEmail)}`)
        .subscribe({
          next: (res) => {
            this.chatUserName = (res.firstName || '') + ' ' + (res.lastName || '');
            this.cd.detectChanges();
          },
          error: () => {
            this.chatUserName = this.otherEmail;
            this.cd.detectChanges();
          }
        });
    }

    this.loadMessages();
  }

  private getAuthHeaders(): HttpHeaders {
    const token = sessionStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  loadMessages() {
    this.http.get<any[]>(
      `${this.API}/api/messages/${encodeURIComponent(this.myEmail)}/${encodeURIComponent(this.otherEmail)}`,
      { headers: this.getAuthHeaders() }
    ).subscribe({
      next: (res) => {
        this.messages = res;
        this.cd.detectChanges();
      },
      error: (err) => {
        console.error("Load message error", err);
      }
    });
  }

  sendMessage() {
    if (!this.newMessage.trim()) return;

    const payload = {
      senderEmail: this.myEmail,
      receiverEmail: this.otherEmail === 'ALL' ? 'ALL' : this.otherEmail,
      text: this.newMessage
    };

    this.http.post(`${this.API}/api/messages/send`, payload, {
      headers: this.getAuthHeaders()
    }).subscribe({
      next: () => {
        this.newMessage = '';
        this.loadMessages();
      },
      error: (err) => {
        console.error("Send error", err);
      }
    });
  }

  closeChat() {
    sessionStorage.removeItem('chatUser');

    const role = sessionStorage.getItem('role');

    if (role === 'Admin') {
      this.router.navigate(['/dashboard']);
    } else {
      this.router.navigate(['/user-dashboard']);
    }
  }
}