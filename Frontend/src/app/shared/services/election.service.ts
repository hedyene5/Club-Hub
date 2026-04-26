import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Election, Candidate, Vote, ElectionResults, EligibilityCriteria, EligibilityResult } from '../../models/election.model';
import { apiUrl } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ElectionService {
  private baseUrl = apiUrl('/api/elections');

  constructor(private http: HttpClient) { }

  // CRUD
  getAllElections(): Observable<Election[]> {
    return this.http.get<Election[]>(this.baseUrl);
  }

  getElectionById(id: string): Observable<Election> {
    return this.http.get<Election>(`${this.baseUrl}/${id}`);
  }

  getElectionsByClub(clubId: string): Observable<Election[]> {
    return this.http.get<Election[]>(`${this.baseUrl}/club/${clubId}`);
  }

  createElection(election: Election): Observable<Election> {
    return this.http.post<Election>(this.baseUrl, election);
  }

  updateElection(id: string, election: Election): Observable<Election> {
    return this.http.put<Election>(`${this.baseUrl}/${id}`, election);
  }

  deleteElection(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  // Opérations spécifiques
  startElection(id: string): Observable<Election> {
    return this.http.post<Election>(`${this.baseUrl}/${id}/start`, {});
  }

  closeElection(id: string): Observable<Election> {
    return this.http.post<Election>(`${this.baseUrl}/${id}/close`, {});
  }

  castVote(electionId: string, vote: Vote): Observable<Election> {
    return this.http.post<Election>(`${this.baseUrl}/${electionId}/votes`, vote);
  }

  getResults(electionId: string): Observable<ElectionResults> {
    return this.http.get<ElectionResults>(`${this.baseUrl}/${electionId}/results`);
  }

  // Gestion des candidats
  addCandidate(electionId: string, candidate: Candidate): Observable<Election> {
    return this.http.post<Election>(`${this.baseUrl}/${electionId}/candidates`, candidate);
  }

  getCandidates(electionId: string): Observable<Candidate[]> {
    return this.http.get<Candidate[]>(`${this.baseUrl}/${electionId}/candidates`);
  }

  validateCandidate(electionId: string, candidateId: string): Observable<Election> {
    return this.http.put<Election>(`${this.baseUrl}/${electionId}/candidates/${candidateId}/validate`, {});
  }

  rejectCandidate(electionId: string, candidateId: string, reason?: string): Observable<Election> {
    return this.http.put<Election>(`${this.baseUrl}/${electionId}/candidates/${candidateId}/reject?reason=${reason || ''}`, {});
  }

  removeCandidate(electionId: string, candidateId: string): Observable<Election> {
    return this.http.delete<Election>(`${this.baseUrl}/${electionId}/candidates/${candidateId}`);
  }

  // ========== NOUVELLES MÉTHODES ==========

  // Soumettre une candidature avec vérification d'éligibilité
  submitCandidacy(electionId: string, candidate: Candidate): Observable<EligibilityResult> {
    return this.http.post<EligibilityResult>(`${this.baseUrl}/${electionId}/candidacy`, candidate);
  }

  // Promouvoir le gagnant d'une élection présidentielle en CEO
  promoteWinnerToCEO(electionId: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/${electionId}/promote-winner`, {});
  }

  // Obtenir les conditions d'éligibilité
  getEligibilityCriteria(electionId: string): Observable<EligibilityCriteria> {
    return this.http.get<EligibilityCriteria>(`${this.baseUrl}/${electionId}/eligibility-criteria`);
  }
}