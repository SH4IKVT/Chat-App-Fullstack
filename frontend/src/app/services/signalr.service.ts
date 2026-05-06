import * as signalR from '@microsoft/signalr';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SignalrService {

  private hubConnection!: signalR.HubConnection;

  startConnection() {

    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl('http://localhost:5119/chatHub')
      .withAutomaticReconnect()
      .build();

    this.hubConnection
      .start()
      .then(() => console.log('SignalR Connected'))
      .catch(err => console.log('SignalR Error:', err));
  }

  onReceiveMessage(callback: (data: any) => void) {

    this.hubConnection.on('ReceiveMessage', (data) => {
      callback(data);
    });

  }
}