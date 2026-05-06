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
  selectedUsers: string[] = [];
  allUsers: any[] = [];
  isBroadcastMode = false;
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

    // ✅ CHECK BROADCAST MODE
    this.isBroadcastMode = this.otherEmail === 'ALL';

    // ✅ Load users for multi-select
    if (this.isBroadcastMode) {

      this.http.get<any[]>(`${this.API}/api/auth/users`)
        .subscribe({
          next: (res) => {

            this.allUsers = res.filter(u =>
              u.email.toLowerCase() !== this.myEmail.toLowerCase()
            );

            this.cd.detectChanges();
          }
        });

    }

    if (!this.otherEmail) {
      console.error("No chat user found");
      return;
    }

    // ✅ FIX: Handle "ALL" properly
    if (this.otherEmail === 'ALL') {
      this.chatUserName = 'ALL USERS';
    } else {

      this.http.get<any>(
        `${this.API}/api/auth/user/${encodeURIComponent(this.otherEmail)}`
      )
      .subscribe({
        next: (res) => {

          this.chatUserName =
            (res.firstName || '') + ' ' + (res.lastName || '');

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

    // ✅ ALL USERS CHAT
    if (this.otherEmail === 'ALL') {

      this.http.get<any[]>(
        `${this.API}/api/messages/all`,
        { headers: this.getAuthHeaders() }
      ).subscribe({

        next: (res) => {

          this.messages = res.filter(m => {

            const sender = m.senderEmail?.toLowerCase();
            const receiver = m.receiverEmail?.toLowerCase();
            const admin = this.myEmail.toLowerCase();

            // ✅ Admin broadcast messages
            const broadcast =
              sender === admin &&
              receiver === 'all';

            // ✅ Messages sent TO admin
            const repliesToAdmin =
              receiver === admin;

            return broadcast || repliesToAdmin;

          });
          if(this.isBroadcastMode===true){

          }

          this.cd.detectChanges();
        },

        error: (err) => {
          console.error("Load ALL chat error", err);
        }

      });

      return;
    }

    // ✅ NORMAL USER CHAT
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

    // ✅ MULTI USER SEND
// ✅ MULTI USER SEND
    if (this.isBroadcastMode && this.selectedUsers.length > 0) {

      const selectedList = [...this.selectedUsers];

      selectedList.forEach(userEmail => {

        const payload = {
          senderEmail: this.myEmail,
          receiverEmail: userEmail,
          text: this.newMessage
        };

        this.http.post(
          `${this.API}/api/messages/send`,
          payload,
          { headers: this.getAuthHeaders() }
        ).subscribe();

      });

      // ✅ SHOW IN CHAT WINDOW
      this.messages.push({
        senderEmail: this.myEmail,
        receiverEmail: selectedList.join(', '),
        text: this.newMessage,
        multiSend: true
      });

      this.newMessage = '';
      this.selectedUsers = [];

      this.cd.detectChanges();

      return;
    }

    // ✅ NORMAL SEND
    const payload = {
      senderEmail: this.myEmail,
      receiverEmail: this.otherEmail,
      text: this.newMessage
    };

    this.http.post(
      `${this.API}/api/messages/send`,
      payload,
      { headers: this.getAuthHeaders() }
    ).subscribe({
      next: () => {
        this.newMessage = '';
        this.loadMessages();
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