import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService, StoredUser } from '../../shared/services/auth.service';
import { apiUrl } from '../../../environments/environment';

@Component({
  selector: 'app-setup-club',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './setup-club.component.html',
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

  private currentUser: StoredUser | null = null;
  private userId = '';
  private firstName = '';
  private lastName = '';
  private email = '';

  constructor(
      private router: Router,
      private http: HttpClient,
      private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    const pending = JSON.parse(localStorage.getItem('pendingUser') || 'null');

    if (this.currentUser?.userId) {
      this.userId = this.currentUser.userId;
      this.firstName = this.currentUser.firstName || pending?.firstName || '';
      this.lastName = this.currentUser.lastName || pending?.lastName || '';
      this.email = this.currentUser.email || pending?.email || '';
    } else if (pending?.id) {
      this.userId = pending.id;
      this.firstName = pending.firstName || '';
      this.lastName = pending.lastName || '';
      this.email = pending.email || '';
    } else {
      console.warn('setup-club: aucun utilisateur actif, redirection vers /signin');
      this.router.navigate(['/signin']);
      return;
    }

    // ✅ Redirect to the BACK‑OFFICE club page if the user already has a club
    if (this.currentUser?.clubId) {
      this.router.navigate(['/app/clubs', this.currentUser.clubId]);
    }
  }

  createClub(): void {
    if (!this.clubName.trim() || !this.userId) {
      this.error = 'Veuillez saisir un nom de club.';
      return;
    }

    this.loading = true;
    this.error = '';

    const clubData = {
      name: this.clubName.trim(),
      description: this.description,
      category: this.category,
      logoUrl: this.logoUrl,
      colorPalette: this.colorPalette,
      visibility: 'PUBLIC',
      createdBy: this.userId,
      members: [
        {
          userId: this.userId,
          email: this.email,
          name: `${this.firstName} ${this.lastName}`.trim(),
          role: 'PRESIDENT',
          status: 'APPROVED',
        },
      ],
    };

    this.http
        .post<any>(apiUrl('/api/clubs'), clubData, { withCredentials: true })
        .subscribe({
          next: (createdClub) => {
            this.http
                .put<any>(
                    apiUrl(`/api/users/${this.userId}/club`),
                    { clubId: createdClub.id },
                    { withCredentials: true },
                )
                .subscribe({
                  next: () => {
                    this.authService.updateLocalProfile({
                      clubId: createdClub.id,
                      clubName: createdClub.name,
                      role: 'PRESIDENT',
                    });

                    localStorage.removeItem('pendingUser');
                    this.loading = false;
                    // ✅ GO TO THE BACK‑OFFICE CLUB DETAIL PAGE
                    this.router.navigate(['/app/clubs', createdClub.id]);
                  },
                  error: (err) => {
                    console.error('Erreur association club:', err);
                    this.loading = false;
                    this.error = 'Erreur lors de la mise à jour du compte.';
                  },
                });
          },
          error: (err) => {
            console.error('Erreur création club:', err);
            this.loading = false;
            this.error = err?.error?.message || 'Erreur lors de la création du club.';
          },
        });
  }
}