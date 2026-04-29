import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './chat.component.html'
})
export class ChatComponent {
  messages: any[] = [];
  message = '';

  send() {
    this.messages.push({
      user: 'You',
      text: this.message,
      time: new Date().toLocaleTimeString(),
      type: 'sent'
    });

    this.message = '';
  }
}
