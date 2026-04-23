import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CustomRole {
  id?: string;
  clubId: string;
  roleName: string;
  description: string;
  permissions: string[];
  isActive: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class CustomRoleService {
  private apiUrl = 'http://192.168.1.20:8081/api/roles';

  constructor(private http: HttpClient) {}

  getRolesByClub(clubId: string): Observable<CustomRole[]> {
    return this.http.get<CustomRole[]>(`${this.apiUrl}/club/${clubId}`);
  }

  getRoleById(id: string): Observable<CustomRole> {
    return this.http.get<CustomRole>(`${this.apiUrl}/${id}`);
  }

  createRole(role: Partial<CustomRole>): Observable<CustomRole> {
    return this.http.post<CustomRole>(this.apiUrl, role);
  }

  updateRole(id: string, role: Partial<CustomRole>): Observable<CustomRole> {
    return this.http.put<CustomRole>(`${this.apiUrl}/${id}`, role);
  }

  deleteRole(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
