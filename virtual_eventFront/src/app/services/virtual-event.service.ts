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

  // Créer un nouvel événement
  createEvent(event: Omit<VirtualEvent, 'id'>): Observable<VirtualEvent> {
    return this.http.post<VirtualEvent>(this.apiUrl, event);
  }

  // Récupérer tous les événements
  getAllEvents(): Observable<VirtualEvent[]> {
    return this.http.get<VirtualEvent[]>(this.apiUrl);
  }

  // Récupérer les événements entre deux dates (utile pour le calendrier)
  getEventsBetween(start: string, end: string): Observable<VirtualEvent[]> {
    return this.http.get<VirtualEvent[]>(`${this.apiUrl}/between?start=${start}&end=${end}`);
  }

  // Modifier un événement
  updateEvent(id: string, event: Partial<VirtualEvent>): Observable<VirtualEvent> {
    return this.http.put<VirtualEvent>(`${this.apiUrl}/${id}`, event);
  }
  // Supprimer un événement
  deleteEvent(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}