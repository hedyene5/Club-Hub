import { Injectable } from '@angular/core';
import { Client, IMessage } from '@stomp/stompjs';

@Injectable({
    providedIn: 'root'
})
export class ChatService {

    public client!: Client;
    public messages: string[] = [];

    connect() {
        this.client = new Client({
            brokerURL: 'ws://localhost:8081/ws', // 🔥 IMPORTANT
            reconnectDelay: 5000
        });

        this.client.onConnect = () => {
            this.client.subscribe('/topic/messages', (msg: IMessage) => {
                this.messages.push(msg.body);
            });
        };

        this.client.activate();
    }

    sendMessage(message: string) {
        this.client.publish({
            destination: '/app/chat',
            body: message
        });
    }
}