import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {apiUrl} from "../../../environments/environment";


export interface EventReview {
    id?: string;
    eventId: string;
    userId: string;
    userName: string;
    rating: number;
    comment: string;
    approved?: boolean;
    flagged?: boolean;
    reason?: string;
    createdAt?: string;
}

export interface ReviewSummary {
    averageRating: number;
    totalReviews: number;
}

@Injectable({
    providedIn: 'root'
})
export class EventReviewService {

    private readonly baseUrl =  apiUrl('/api/event-reviews');

    constructor(private http: HttpClient) {}

    addReview(payload: EventReview): Observable<EventReview> {
        return this.http.post<EventReview>(this.baseUrl, payload);
    }

    getReviews(eventId: string): Observable<EventReview[]> {
        return this.http.get<EventReview[]>(`${this.baseUrl}/${eventId}`);
    }

    getSummary(eventId: string): Observable<ReviewSummary> {
        return this.http.get<ReviewSummary>(`${this.baseUrl}/${eventId}/summary`);
    }
}