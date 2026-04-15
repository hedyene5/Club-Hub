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
  private apiUrl = 'http://localhost:8084/api/roles';

  constructor(private http: HttpClient) {}

  getRolesByClub(clubId: string): Observable<CustomRole[]> {
    return this.http.get<CustomRole[]>(`${this.apiUrl}/club/${clubId}`);
  }

  getRoleById(id: string): Observable<CustomRole> {
    return this.http.get<CustomRole>(`${this.apiUrl}/${id}`);
  }
}
