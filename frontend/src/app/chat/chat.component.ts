import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit {

  chatUser: string = '';
  messages: any[] = [];
  newMessage: string = '';

  myEmail: string = '';
  otherEmail: string = '';

  constructor(
    private auth: AuthService,
    private cd: ChangeDetectorRef,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.myEmail = localStorage.getItem('email') || '';
    this.otherEmail = localStorage.getItem('chatUser') || '';

    if (!this.otherEmail) {
      this.chatUser = 'Unknown';
      return;
    }

    // 🔥 get name
    this.auth.getUserByEmail(this.otherEmail).subscribe({
      next: (res: any) => {
        this.chatUser = res?.name || this.otherEmail;
        this.cd.detectChanges();
      }
    });

    this.loadMessages();
  }

  // 🔥 LOAD FROM DB
  loadMessages() {
    this.http.get<any[]>(
      `http://localhost:5119/api/messages/${this.myEmail}/${this.otherEmail}`
    ).subscribe({
      next: (res) => {
        this.messages = res;
        this.cd.detectChanges();
      },
      error: (err) => console.error("Load message error", err)
    });
  }

  // 🔥 SEND TO DB
  sendMessage() {
    if (!this.newMessage.trim()) return;

    const payload = {
      senderEmail: this.myEmail,
      receiverEmail: this.otherEmail,
      text: this.newMessage
    };

    this.http.post(`http://localhost:5119/api/messages/send`, payload)
      .subscribe({
        next: () => {
          this.newMessage = '';
          this.loadMessages(); // reload after send
        },
        error: (err) => console.error("Send error", err)
      });
  }

  closeChat() {
    localStorage.removeItem('chatUser');
    window.location.href = '/user-dashboard';
  }
}