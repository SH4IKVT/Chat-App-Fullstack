import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
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

  constructor(
    private cd: ChangeDetectorRef,
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit() {
    this.myEmail = localStorage.getItem('email') || '';
    this.otherEmail = localStorage.getItem('chatUser') || '';

    // 🔥 NO API CALL → NO 401
    this.chatUser = localStorage.getItem('chatUserName') || this.otherEmail;

    if (!this.otherEmail) {
      this.chatUser = 'Unknown';
      return;
    }

    this.loadMessages();
  }

  loadMessages() {
    this.http.get<any[]>(
      `${this.API}/api/messages/${this.myEmail}/${this.otherEmail}`
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

    this.http.post(`${this.API}/api/messages/send`, payload)
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
      this.router.navigate(['/admin-dashboard']);
    } else {
      this.router.navigate(['/user-dashboard']);
    }
  }
}