import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { apiUrl } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class DashboardService {

    private readonly baseUrl = apiUrl('/api/dashboard');

    constructor(private http: HttpClient) {}

    getStats(): Observable<any> {
        return this.http.get<any>(`${this.baseUrl}/stats`);
    }

    getEvents(): Observable<any[]> {
        return this.http.get<any[]>(`${this.baseUrl}/events`);
    }
}