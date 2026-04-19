import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Election, Candidate, Vote, EligibilityResult } from '../models/election.model';

@Injectable({
  providedIn: 'root'
})
export class ElectionService {
  private apiUrl = 'http://localhost:8084/api/elections';

  constructor(private http: HttpClient) {}

  // ---------------- CRUD ----------------
  getAllElections(): Observable<Election[]> {
    return this.http.get<Election[]>(this.apiUrl);
  }

  getElectionById(id: string): Observable<Election> {
    return this.http.get<Election>(`${this.apiUrl}/${id}`);
  }

  getElectionsByClub(clubId: string): Observable<Election[]> {
    return this.http.get<Election[]>(`${this.apiUrl}/club/${clubId}`);
  }

  createElection(election: Election): Observable<Election> {
    return this.http.post<Election>(this.apiUrl, election);
  }

  updateElection(id: string, election: Election): Observable<Election> {
    return this.http.put<Election>(`${this.apiUrl}/${id}`, election);
  }

  deleteElection(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // ---------------- Lifecycle ----------------
  startElection(id: string): Observable<Election> {
    return this.http.put<Election>(`${this.apiUrl}/${id}/start`, {});
  }

  closeElection(id: string): Observable<Election> {
    return this.http.put<Election>(`${this.apiUrl}/${id}/close`, {});
  }

  // ---------------- Candidacy ----------------
  addCandidate(electionId: string, candidate: Candidate): Observable<Election> {
    return this.http.post<Election>(`${this.apiUrl}/${electionId}/candidates`, candidate);
  }

  submitCandidacy(electionId: string, application: Candidate): Observable<EligibilityResult> {
    return this.http.post<EligibilityResult>(`${this.apiUrl}/${electionId}/candidacy`, application);
  }

  validateCandidate(electionId: string, candidateId: string): Observable<Election> {
    return this.http.put<Election>(`${this.apiUrl}/${electionId}/candidates/${candidateId}/validate`, {});
  }

  rejectCandidate(electionId: string, candidateId: string, reason: string): Observable<Election> {
    return this.http.put<Election>(
      `${this.apiUrl}/${electionId}/candidates/${candidateId}/reject`,
      { reason }
    );
  }

  // ---------------- Vote ----------------
  castVote(electionId: string, vote: Vote): Observable<Election> {
    return this.http.post<Election>(`${this.apiUrl}/${electionId}/votes`, vote);
  }
}
