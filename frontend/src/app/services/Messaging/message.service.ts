import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MessageDTO } from '../../models/message.model';

@Injectable({
    providedIn: 'root'
})
export class MessageService {

    private baseUrl = 'http://localhost:8081/api';   // ← Your backend port is 8081

    constructor(private http: HttpClient) {}

    /**
     * Get all messages for a conversation
     */
    // In message.service.ts
    getMessagesByConversation(conversationId: string, userId: string): Observable<MessageDTO[]> {
        return this.http.get<MessageDTO[]>(
            `${this.baseUrl}/conversations/${conversationId}/messages?userId=${userId}`,
            { withCredentials: true }
        );
    }
    /**
     * Send a new message
     */
    sendMessage(
        conversationId: string,
        senderId: string,
        content: string,
        parentMessageId?: string | null
    ): Observable<MessageDTO> {
        return this.http.post<MessageDTO>(
            `${this.baseUrl}/conversations/${conversationId}/messages`,
            { conversationId, senderId, content, parentMessageId: parentMessageId || null },
            { withCredentials: true }
        );
    }

    updateMessage(conversationId: string, messageId: string, content: string): Observable<MessageDTO> {
        return this.http.put<MessageDTO>(
            `${this.baseUrl}/conversations/${conversationId}/messages/${messageId}`,
            { content },
            { withCredentials: true }
        );
    }
    deleteMessage(conversationId: string, messageId: string): Observable<MessageDTO> {
        return this.http.delete<MessageDTO>(
            `${this.baseUrl}/conversations/${conversationId}/messages/${messageId}`,
            { withCredentials: true }
        );
    }
}