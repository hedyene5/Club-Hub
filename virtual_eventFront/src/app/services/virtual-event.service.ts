import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { VirtualEvent } from '../models/virtual-event';

@Injectable({
  providedIn: 'root'
})
export class VirtualEventService {
  private readonly apiUrl = `${environment.apiUrl}/api/virtual-events`;

  constructor(private http: HttpClient) {}

  getAllEvents(): Observable<VirtualEvent[]> {
    return this.http.get<VirtualEvent[]>(this.apiUrl);
  }

  register(eventId: string, userId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${eventId}/register/${userId}`, {});
  }

  pay(eventId: string, userId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${eventId}/pay/${userId}`, {});
  }

  canJoin(eventId: string, userId: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/${eventId}/can-join/${userId}`);
  }
}