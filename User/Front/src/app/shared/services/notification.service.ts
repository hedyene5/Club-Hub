import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';

export interface AppNotification {
  id: string;
  userId: string;
  message: string;
  reportId: string;
  reportedUserId: string;
  read: boolean;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {

  private readonly api = 'http://localhost:8082/api/notifications';
  private _notifications = new BehaviorSubject<AppNotification[]>([]);
  readonly notifications$ = this._notifications.asObservable();

  constructor(private http: HttpClient) {}

  load(userId: string) {
    this.http.get<AppNotification[]>(`${this.api}?userId=${userId}`)
      .subscribe({ next: (data) => this._notifications.next(data), error: () => {} });
  }

  markRead(id: string) {
    this.http.patch(`${this.api}/${id}/read`, {}).subscribe({
      next: (updated: any) => {
        const list = this._notifications.value.map(n => n.id === id ? { ...n, read: true } : n);
        this._notifications.next(list);
      },
      error: () => {}
    });
  }

  get unreadCount(): number {
    return this._notifications.value.filter(n => !n.read).length;
  }
}
