// src/app/services/Game/game-websocket.service.ts

import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { WebSocketService } from '../Messaging/websocket.service';
import { StompSubscription } from '@stomp/stompjs';
import { GameEvent } from '../../models/game.model';

@Injectable({
    providedIn: 'root'
})
export class GameWebSocketService implements OnDestroy {
    private gameSubscriptions: Map<string, StompSubscription> = new Map();
    private currentConversationId: string | null = null;

    // BehaviorSubject for game events
    private gameEventSubject = new BehaviorSubject<GameEvent | null>(null);
    public gameEvent$ = this.gameEventSubject.asObservable();

    constructor(private webSocketService: WebSocketService) {
        this.webSocketService.connect();
    }

    /**
     * Subscribe to game events for a specific conversation
     */
    subscribeToGameEvents(conversationId: string): void {
        this.unsubscribeFromGameEvents();
        this.currentConversationId = conversationId;
        const topic = `/topic/game/${conversationId}`;

        const sub = this.webSocketService.subscribeToTopic(
            topic,
            (event: any) => {   // ← use any, not GameEvent
                console.log('🎮 Game event received:', event);
                this.gameEventSubject.next(event);
            }
        );

        if (sub) {
            this.gameSubscriptions.set(conversationId, sub);
        }
    }

    /**
     * Unsubscribe from current game events
     */
    unsubscribeFromGameEvents(): void {
        if (this.currentConversationId) {
            const sub = this.gameSubscriptions.get(this.currentConversationId);
            if (sub) {
                sub.unsubscribe();
                this.gameSubscriptions.delete(this.currentConversationId);
            }
        }
        this.currentConversationId = null;
    }

    ngOnDestroy(): void {
        this.unsubscribeFromGameEvents();
        this.gameEventSubject.complete();
    }
}