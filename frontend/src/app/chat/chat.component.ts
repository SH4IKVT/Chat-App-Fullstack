import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit {

  chatUser: string = '';
  messages: { text: string, sender: string }[] = [];
  newMessage: string = '';

  constructor(private auth: AuthService, private cd: ChangeDetectorRef) {}

  ngOnInit() {
    const email = localStorage.getItem('chatUser');

    console.log("CHAT EMAIL:", email);

    if (!email) {
      this.chatUser = 'Unknown';
      this.cd.detectChanges();
      return;
    }

    // 🔥 HANDLE ALL USERS
    if (email === 'ALL') {
      this.chatUser = 'All Users';
      this.cd.detectChanges();
      return;
    }

    // 🔥 FETCH USER NAME FROM BACKEND
    this.auth.getUserByEmail(email).subscribe({
      next: (res: any) => {
        console.log("CHAT USER DATA:", res);

        this.chatUser = res?.name || email;

        // 🔥 FORCE UI UPDATE (THIS IS THE FIX)
        this.cd.detectChanges();
      },
      error: (err) => {
        console.error("Chat fetch error:", err);

        this.chatUser = email;

        this.cd.detectChanges();
      }
    });
  }
  closeChat(){
  localStorage.removeItem('chatUser');
  // 🔥 navigate back to dashboard
  window.location.href = '/dashboard';
  }

  sendMessage() {
    if (!this.newMessage.trim()) return;

    this.messages.push({
      text: this.newMessage,
      sender: 'me'
    });

    this.newMessage = '';
  }
}