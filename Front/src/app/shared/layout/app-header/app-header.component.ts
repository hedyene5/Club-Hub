import { Component, ElementRef, ViewChild, OnInit } from '@angular/core';
import { SidebarService } from '../../services/sidebar.service';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { ThemeToggleButtonComponent } from '../../components/common/theme-toggle/theme-toggle-button.component';
import { NotificationDropdownComponent } from '../../components/header/notification-dropdown/notification-dropdown.component';
import { UserDropdownComponent } from '../../components/header/user-dropdown/user-dropdown.component';
import { ClubService } from '../../../services/club.service';
import { AuthService } from '../../../services/auth.service'; // ← AJOUTER
import { Club } from '../../../models/club.model';

@Component({
  selector: 'app-header',
  imports: [
    CommonModule,
    RouterModule,
    ThemeToggleButtonComponent,
    NotificationDropdownComponent,
    UserDropdownComponent,
  ],
  templateUrl: './app-header.component.html',
})
export class AppHeaderComponent implements OnInit {
  isApplicationMenuOpen = false;
  readonly isMobileOpen$;
  currentClub: Club | null = null;
  clubId: string | null = null;

  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  constructor(
    public sidebarService: SidebarService,
    private router: Router,
    private route: ActivatedRoute,
    private clubService: ClubService,
    private authService: AuthService // ← AJOUTER
  ) {
    this.isMobileOpen$ = this.sidebarService.isMobileOpen$;
  }

  ngOnInit(): void {
    const currentUser = this.authService.getCurrentUser();

    if (currentUser?.clubId) {
      this.clubId = currentUser.clubId;
      this.loadClub(currentUser.clubId);
    }

    // Écouter les changements de route pour charger le club de la page courante
    this.router.events.subscribe(() => {
      const url = this.router.url;
      const match = url.match(/\/clubs\/([^\/]+)/);

      if (match) {
        const newClubId = match[1];
        // Charger si différent OU si pas encore chargé
        if (newClubId !== this.clubId || !this.currentClub) {
          this.clubId = newClubId;
          this.loadClub(this.clubId);
        }
      } else if (!this.currentClub && currentUser?.clubId) {
        // Sur d'autres pages, charger quand même le club du user
        this.clubId = currentUser.clubId;
        this.loadClub(currentUser.clubId);
      }
    });

    // Charger aussi depuis la route courante au démarrage
    const url = this.router.url;
    const match = url.match(/\/clubs\/([^\/]+)/);
    if (match && match[1] !== this.clubId) {
      this.clubId = match[1];
      this.loadClub(this.clubId);
    }
  }

  loadClub(id: string): void {
    this.clubService.getClubById(id).subscribe({
      next: (club) => {
        this.currentClub = club;
        this.applyTheme(club);
      },
      error: (err) => {
        console.error('Erreur chargement club:', err);
      }
    });
  }

  applyTheme(club: Club): void {
    if (club.colorPalette) {
      document.documentElement.style.setProperty('--primary-color', club.colorPalette);
    }
  }

  resetTheme(): void {
    document.documentElement.style.setProperty('--primary-color', '#3B82F6');
  }

  handleToggle() {
    if (window.innerWidth >= 1280) {
      this.sidebarService.toggleExpanded();
    } else {
      this.sidebarService.toggleMobileOpen();
    }
  }

  toggleApplicationMenu() {
    this.isApplicationMenuOpen = !this.isApplicationMenuOpen;
  }

  ngAfterViewInit() {
    document.addEventListener('keydown', this.handleKeyDown);
  }

  ngOnDestroy() {
    document.removeEventListener('keydown', this.handleKeyDown);
  }

  handleKeyDown = (event: KeyboardEvent) => {
    if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
      event.preventDefault();
      this.searchInput?.nativeElement.focus();
    }
  };
}