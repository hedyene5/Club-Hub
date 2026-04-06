import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { VirtualEvent } from '../models/virtual-event';

@Injectable({
  providedIn: 'root'
})
export class VirtualEventService {

  private apiUrl = 'http://localhost:8081/api/virtual-events';

  constructor(private http: HttpClient) {}

  createEvent(event: Omit<VirtualEvent, 'id'>): Observable<VirtualEvent> {
    return this.http.post<VirtualEvent>(this.apiUrl, event);
  }

  getAllEvents(): Observable<VirtualEvent[]> {
    return this.http.get<VirtualEvent[]>(this.apiUrl);
  }

  updateEvent(id: string, event: Partial<VirtualEvent>): Observable<VirtualEvent> {
    return this.http.put<VirtualEvent>(`${this.apiUrl}/${id}`, event);
  }

  deleteEvent(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // 🔥 inscription
  joinEvent(id: string): Observable<VirtualEvent> {
    return this.http.put<VirtualEvent>(`${this.apiUrl}/${id}/join`, {});
  }
}