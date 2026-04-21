import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-setup-club',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './setup-club.component.html'
})
export class SetupClubComponent implements OnInit {
  clubName = '';
  description = '';
  category = 'Culture';
  logoUrl = '';
  colorPalette = '#3B82F6';
  loading = false;
  error = '';

  categories = ['Culture', 'Sport', 'Technologie', 'Science', 'Art', 'Musique'];

  pendingUser: any = null;

  constructor(
    private router: Router,
    private http: HttpClient,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.pendingUser = JSON.parse(localStorage.getItem('pendingUser') || 'null');
    console.log('📝 pendingUser:', this.pendingUser);
    
    if (!this.pendingUser || !this.pendingUser.id) {
      console.error('❌ Pas de pendingUser valide');
      this.router.navigate(['/signup']);
    }
  }

  createClub(): void {
    if (!this.clubName || !this.pendingUser) return;
  
    this.loading = true;
    this.error = '';
  
    const clubData = {
      name: this.clubName,
      description: this.description,
      category: this.category,
      logoUrl: this.logoUrl,
      colorPalette: this.colorPalette,
      visibility: 'PUBLIC',
      createdBy: this.pendingUser.id,
      members: [{
        userId: this.pendingUser.id,
        email: this.pendingUser.email,
        name: `${this.pendingUser.firstName} ${this.pendingUser.lastName}`.trim(),
        role: 'PRESIDENT',
        status: 'APPROVED'
      }]
    };
  
    // ✅ Appel via le Gateway (port 8084)
    this.http.post<any>('http://172.18.72.32:8083/api/clubs', clubData, {
      withCredentials: true
    }).subscribe({
      next: (createdClub) => {
        console.log('✅ Club créé:', createdClub);
  
        // ✅ Appel via le Gateway (port 8084) pour associer le club
        this.http.put<any>(
          `http://172.18.72.32:8081/api/users/${this.pendingUser.id}/club`,
          { clubId: createdClub.id },
          { withCredentials: true }
        ).subscribe({
          next: (updatedUser) => {
            console.log('✅ Club associé au user:', updatedUser);
  
            // ✅ Stocker dans localStorage sous 'user' (pas 'currentUser')
            const storedUser = {
              userId: updatedUser.id || this.pendingUser.id,
              email: updatedUser.email,
              firstName: this.pendingUser.firstName,
              lastName: this.pendingUser.lastName,
              role: 'PRESIDENT',
              clubId: createdClub.id,
              clubName: createdClub.name
            };
  
            localStorage.setItem('user', JSON.stringify(storedUser));
            localStorage.removeItem('pendingUser');
  
            this.loading = false;
            this.router.navigate(['/clubs', createdClub.id]);
          },
          error: (err) => {
            console.error('❌ Erreur association club:', err);
            this.loading = false;
            this.error = 'Erreur lors de la mise à jour du compte';
          }
        });
      },
      error: (err) => {
        console.error('❌ Erreur création club:', err);
        this.loading = false;
        this.error = err.error?.message || 'Erreur lors de la création du club';
      }
    });
  }
}