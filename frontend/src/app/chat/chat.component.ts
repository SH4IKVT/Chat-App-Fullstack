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

  chatUser: string = '';
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
    this.myEmail = localStorage.getItem('email') || '';
    this.otherEmail = localStorage.getItem('chatUser') || '';

    if (!this.otherEmail) {
      this.chatUser = 'Unknown';
      return;
    }

    // Fetch the user details for full name
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

    this.loadMessages();
  }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
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
      receiverEmail: this.otherEmail,
      text: this.newMessage
    };

    this.http.post(`${this.API}/api/messages/send`, payload, { headers: this.getAuthHeaders() })
      .subscribe({
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