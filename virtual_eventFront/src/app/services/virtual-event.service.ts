import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { VirtualEvent } from '../models/virtual-event';

@Injectable({
  providedIn: 'root'
})
export class VirtualEventService {

  private apiUrl = 'http://localhost:8082/api/virtual-events';

  constructor(private http: HttpClient) {}

  // ================= EVENTS =================

  getAllEvents(): Observable<VirtualEvent[]> {
    return this.http.get<VirtualEvent[]>(this.apiUrl);
  }

  createEvent(event: Omit<VirtualEvent, 'id'>): Observable<VirtualEvent> {
    return this.http.post<VirtualEvent>(this.apiUrl, event);
  }

  updateEvent(id: string, event: Partial<VirtualEvent>): Observable<VirtualEvent> {
    return this.http.put<VirtualEvent>(`${this.apiUrl}/${id}`, event);
  }

  deleteEvent(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // ================= REGISTRATION =================

  register(eventId: string, userId: string) {
    return this.http.post(`${this.apiUrl}/${eventId}/register/${userId}`, {});
  }

  pay(eventId: string, userId: string) {
    return this.http.post(`${this.apiUrl}/${eventId}/pay/${userId}`, {});
  }

  canJoin(eventId: string, userId: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/${eventId}/can-join/${userId}`);
  }

  // (optionnel si tu veux garder)
  joinEvent(id: string): Observable<VirtualEvent> {
    return this.http.put<VirtualEvent>(`${this.apiUrl}/${id}/join`, {});
  }
}