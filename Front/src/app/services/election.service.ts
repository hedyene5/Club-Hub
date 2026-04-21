import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Election, Candidate, Vote, ElectionResults, EligibilityCriteria, EligibilityResult } from '../models/election.model';

@Injectable({
  providedIn: 'root'
})
export class ElectionService {
  private apiUrl = 'http://172.18.72.32:8083/api/elections';

  constructor(private http: HttpClient) { }

  // CRUD
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

  // Opérations spécifiques
  startElection(id: string): Observable<Election> {
    return this.http.post<Election>(`${this.apiUrl}/${id}/start`, {});
  }

  closeElection(id: string): Observable<Election> {
    return this.http.post<Election>(`${this.apiUrl}/${id}/close`, {});
  }

  castVote(electionId: string, vote: Vote): Observable<Election> {
    return this.http.post<Election>(`${this.apiUrl}/${electionId}/votes`, vote);
  }

  getResults(electionId: string): Observable<ElectionResults> {
    return this.http.get<ElectionResults>(`${this.apiUrl}/${electionId}/results`);
  }

  // Gestion des candidats
  addCandidate(electionId: string, candidate: Candidate): Observable<Election> {
    return this.http.post<Election>(`${this.apiUrl}/${electionId}/candidates`, candidate);
  }

  getCandidates(electionId: string): Observable<Candidate[]> {
    return this.http.get<Candidate[]>(`${this.apiUrl}/${electionId}/candidates`);
  }

  validateCandidate(electionId: string, candidateId: string): Observable<Election> {
    return this.http.put<Election>(`${this.apiUrl}/${electionId}/candidates/${candidateId}/validate`, {});
  }

  rejectCandidate(electionId: string, candidateId: string, reason?: string): Observable<Election> {
    return this.http.put<Election>(`${this.apiUrl}/${electionId}/candidates/${candidateId}/reject?reason=${reason || ''}`, {});
  }

  removeCandidate(electionId: string, candidateId: string): Observable<Election> {
    return this.http.delete<Election>(`${this.apiUrl}/${electionId}/candidates/${candidateId}`);
  }

  // ========== NOUVELLES MÉTHODES ==========

  // Soumettre une candidature avec vérification d'éligibilité
  submitCandidacy(electionId: string, candidate: Candidate): Observable<EligibilityResult> {
    return this.http.post<EligibilityResult>(`${this.apiUrl}/${electionId}/candidacy`, candidate);
  }

  // Promouvoir le gagnant d'une élection présidentielle en CEO
  promoteWinnerToCEO(electionId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${electionId}/promote-winner`, {});
  }

  // Obtenir les conditions d'éligibilité
  getEligibilityCriteria(electionId: string): Observable<EligibilityCriteria> {
    return this.http.get<EligibilityCriteria>(`${this.apiUrl}/${electionId}/eligibility-criteria`);
  }

  // Obtenir les comités disponibles pour voter selon le mode
  getAvailableCommittees(electionId: string, userId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${electionId}/available-committees/${userId}`);
  }
}