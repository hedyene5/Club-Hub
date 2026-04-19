import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SessionGuardService } from './services/User/session-guard.service';
import { AuthService } from './services/User/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  title = 'Angular Ecommerce Dashboard | TailAdmin';

  constructor(
      private sessionGuard: SessionGuardService,
      private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.authService.restoreSession().subscribe({
      next: () => {
        // Cookie is valid — start the periodic session watcher
        this.sessionGuard.startWatching();
      },
      error: () => {
        // Cookie expired or missing — clear stale data and redirect to login
        localStorage.removeItem('user');
      }
    });
  }
}