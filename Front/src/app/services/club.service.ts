import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Club, Member, SubGroup, SubGroupRecommendation } from '../models/club.model';

@Injectable({
  providedIn: 'root'
})
export class ClubService {
  private apiUrl = 'http://localhost:8084/api/clubs';

  constructor(private http: HttpClient) { }

  // ========== CRUD ==========
  getAllClubs(): Observable<Club[]> {
    return this.http.get<Club[]>(this.apiUrl);
  }

  getClubById(id: string): Observable<Club> {
    return this.http.get<Club>(`${this.apiUrl}/${id}`);
  }

  createClub(club: Club): Observable<Club> {
    return this.http.post<Club>(this.apiUrl, club);
  }

  updateClub(id: string, club: Club): Observable<Club> {
    return this.http.put<Club>(`${this.apiUrl}/${id}`, club);
  }

  deleteClub(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // ========== GESTION DES MEMBRES ==========
  addMember(clubId: string, member: Member): Observable<Club> {
    return this.http.post<Club>(`${this.apiUrl}/${clubId}/members`, member);
  }

  approveMember(clubId: string, userId: string): Observable<Club> {
    return this.http.put<Club>(`${this.apiUrl}/${clubId}/members/${userId}/approve`, {});
  }

  rejectMember(clubId: string, userId: string): Observable<Club> {
    return this.http.delete<Club>(`${this.apiUrl}/${clubId}/members/${userId}`);
  }

  changeMemberRole(clubId: string, userId: string, role: string): Observable<Club> {
    return this.http.put<Club>(`${this.apiUrl}/${clubId}/members/${userId}/role?role=${role}`, {});
  }

  // ========== GESTION DES SOUS-GROUPES ==========
  addSubGroup(clubId: string, subGroup: SubGroup): Observable<Club> {
    return this.http.post<Club>(`${this.apiUrl}/${clubId}/subgroups`, subGroup);
  }

  removeSubGroup(clubId: string, subGroupId: string): Observable<Club> {
    return this.http.delete<Club>(`${this.apiUrl}/${clubId}/subgroups/${subGroupId}`);
  }

  assignToSubGroup(clubId: string, userId: string, subGroupId: string): Observable<Club> {
    return this.http.put<Club>(`${this.apiUrl}/${clubId}/members/${userId}/subgroup/${subGroupId}`, {});
  }

  removeFromSubGroup(clubId: string, subGroupId: string, userId: string): Observable<Club> {
    return this.http.delete<Club>(`${this.apiUrl}/${clubId}/subgroups/${subGroupId}/members/${userId}`);
  }

  // ========== SERVICE MÉTIER ==========
  recommendRole(clubId: string, userId: string): Observable<SubGroupRecommendation> {
    return this.http.get<SubGroupRecommendation>(`${this.apiUrl}/${clubId}/recommend-role/${userId}`);
  }
 // ========== GESTION DES SOUS-GROUPES ==========
updateSubGroup(clubId: string, subGroupId: string, subGroup: SubGroup): Observable<Club> {
  return this.http.put<Club>(`${this.apiUrl}/${clubId}/subgroups/${subGroupId}`, subGroup);
}

updateMemberInClub(clubId: string, userId: string, memberData: any): Observable<Club> {
  return this.http.put<Club>(`${this.apiUrl}/${clubId}/members/${userId}`, memberData);
}
}