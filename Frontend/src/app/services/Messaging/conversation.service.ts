import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map, of } from 'rxjs';
import { ConversationDTO } from '../../models/conversation.model';
import { UserSimple } from "../../messaging-components/NewPrivateChatModalComponent/new-private-chat-modal.component";
import { ConversationParticipant } from "./participant.service";   // <--- reuse the interface
import { apiUrl } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class ConversationService {

    // Gateway‑friendly base URLs
    private url = apiUrl('/api/conversations');   // formerly 'http://localhost:8081/api/conversations'
    private userUrl = apiUrl('/api/users');       // formerly 'http://localhost:8083/api/users'

    constructor(private http: HttpClient) {}

    // ---------- Conversation list ----------
    getAll(userId: string): Observable<ConversationDTO[]> {
        return this.http.get<ConversationDTO[]>(
            `${this.url}?userId=${userId}`,
            { withCredentials: true }
        );
    }

    // ---------- Create conversations ----------
    createPrivate(userId1: string, userId2: string): Observable<any> {
        return this.http.post(
            `${this.url}/private?userId1=${userId1}&userId2=${userId2}`,
            {},
            { withCredentials: true }
        );
    }

    createConversation(data: { nom: string, type: string }): Observable<any> {
        return this.http.post(`${this.url}`, data, { withCredentials: true });
    }

    // ---------- Leave / Archive ----------
    leaveConversation(conversationId: string, userId: string): Observable<any> {
        return this.http.post(
            `${this.url}/${conversationId}/participants/leave?userId=${userId}`,
            {},
            { withCredentials: true }
        );
    }

    // ---------- Transfer SuperAdmin ----------
    transferSuperAdmin(conversationId: string, fromUserId: string, toUserId: string): Observable<any> {
        return this.http.post(
            `${this.url}/${conversationId}/participants/transfer?fromUserId=${fromUserId}&toUserId=${toUserId}`,
            {},
            { withCredentials: true }
        );
    }

    // ---------- Participants ----------
    getParticipants(conversationId: string): Observable<ConversationParticipant[]> {
        return this.http.get<ConversationParticipant[]>(
            `${this.url}/${conversationId}/participants`,
            { withCredentials: true }
        );
    }

    addParticipant(conversationId: string, userId: string, role: string): Observable<any> {
        return this.http.post(
            `${this.url}/${conversationId}/participants`,
            { conversationId, userId, role },
            { withCredentials: true }
        );
    }

    // ---------- Delete group (SuperAdmin only) ----------
    deleteGroup(conversationId: string, userId: string): Observable<any> {
        return this.http.delete(`${this.url}/${conversationId}?userId=${userId}`);
    }

    // ---------- Messages / Read / Archive ----------
    hideMessagesForUser(conversationId: string, userId: string): Observable<any> {
        return this.http.delete(
            `${this.url}/${conversationId}/messages?userId=${userId}`,
            { withCredentials: true }
        );
    }

    markAsRead(conversationId: string, userId: string): Observable<any> {
        return this.http.put(
            `${this.url}/${conversationId}/read`,
            { userId },
            { withCredentials: true }
        );
    }

    // ---------- Name / Photo ----------
    updateName(conversationId: string, name: string): Observable<any> {
        return this.http.patch(`${this.url}/${conversationId}/name`, { name });
    }

    updatePhotoUrl(conversationId: string, photoUrl: string): Observable<any> {
        return this.http.patch(
            `${this.url}/${conversationId}/photo-url`,
            { photoUrl },
            { withCredentials: true, headers: { 'Content-Type': 'application/json' } }
        );
    }

    // ---------- User search (for new chats) ----------
    loadAllUsers(): Observable<UserSimple[]> {
        return this.http.get<any[]>(this.userUrl, { withCredentials: true }).pipe(
            map((users: any[]) => users.map(u => ({
                userId: u.id,
                fullName: u.firstName + ' ' + u.lastName
            })))
        );
    }

    searchUsers(query: string): Observable<UserSimple[]> {
        if (!query || query.trim() === '') return of([]);
        return this.loadAllUsers().pipe(
            map(users => {
                const q = query.toLowerCase().trim();
                return users.filter(u => u.fullName.toLowerCase().includes(q));
            })
        );
    }

    // Old endpoint (unused) kept for reference
    archiveConversation(conversationId: string, userId: string): Observable<void> {
        return this.http.delete<void>(`${this.url}/${conversationId}/archive?userId=${userId}`);
    }
}