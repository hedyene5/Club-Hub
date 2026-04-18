import { Injectable } from '@angular/core';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { Subject, BehaviorSubject } from 'rxjs';
import { ChatMessage } from '../../../../../../Pi cloud  messaging service v1/MessagingService/frontend/clubhub-messaging/src/app/core/models/message.model';

import { Theme } from '../../models/theme.model';
@Injectable({ providedIn: 'root' })
export class WebSocketService {

  private themeSubject = new BehaviorSubject<Theme | null>(null);
  public themeUpdated$ = this.themeSubject.asObservable();
  private client: Client;
  private subscriptions: Map<string, StompSubscription> = new Map();
  private pendingSubscriptions: Set<string> = new Set();
  private isConnected = new BehaviorSubject<boolean>(false);

  private messageSubject = new Subject<ChatMessage>();
  message$ = this.messageSubject.asObservable();

  constructor() {
    this.client = new Client({
      // Utilisation propre de SockJS
      webSocketFactory: () => new SockJS('http://localhost:8081/ws'),
      reconnectDelay: 5000,

      onConnect: () => {
        console.log('✅ WebSocket connecté');
        this.isConnected.next(true);

        this.pendingSubscriptions.forEach(convId => this.subscribeToConversation(convId));
        this.pendingSubscriptions.clear();
      },

      onDisconnect: () => {
        console.log('❌ WebSocket déconnecté');
        this.isConnected.next(false);
      },

      onStompError: (frame) => {
        console.error('Erreur STOMP:', frame);
      }
    });
  }

  // Active la connexion
  connect(): void {
    if (!this.client.active) {
      this.client.activate();
    }
  }

  // Déconnecte le WebSocket
  disconnect(): void {
    this.client.deactivate();
    this.isConnected.next(false);
  }



  subscribeToConversation(conversationId: string): void {
    const topic = `/topic/conversation/${conversationId}`;

    if (this.subscriptions.has(topic)) return;

    const sub = this.client.subscribe(topic, (message: IMessage) => {
      try {
        const event = JSON.parse(message.body);

        if (event.type === 'THEME_UPDATED' && event.theme) {
          this.themeSubject.next(event.theme as Theme);
        } else {
          // Normal message
          this.messageSubject.next(event as ChatMessage);
        }
      } catch (e) {
        console.error('Failed to parse WebSocket message:', e);
      }
    });

    this.subscriptions.set(topic, sub);
    console.log(`📡 Subscribed to conversation ${conversationId} (messages + themes)`);
  }

  // Désabonnement public
  unsubscribeFromConversation(conversationId: string): void {
    const sub = this.subscriptions.get(conversationId);
    if (sub) {
      sub.unsubscribe();
      this.subscriptions.delete(conversationId);
    }
    this.pendingSubscriptions.delete(conversationId);
  }

  // Envoi de message
  sendMessage(
    conversationId: string,
    senderId: string,
    content: string,
    type: string = 'TEXT',
    parentMessageId?: string
  ): void {
    if (!this.client.connected) {
      console.error('❌ Impossible d\'envoyer — WebSocket non connecté');
      return;
    }

    this.client.publish({
      destination: '/app/chat.send',
      body: JSON.stringify({
        conversationId,
        senderId,
        content,
        type,
        parentMessageId: parentMessageId || null
      })
    });
  }

  // Indique si le WebSocket est connecté
  get connected(): boolean {
    return this.client.connected;
  }
  subscribeToTopic(topic: string, callback: (data: any) => void): StompSubscription {
    if (this.client.connected) {
      return this.client.subscribe(topic, (message: IMessage) => {
        callback(JSON.parse(message.body));
      });
    }
    return null!;
  }

}
