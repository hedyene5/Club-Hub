import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../shared/services/auth.service';

/**
 * Lightweight dashboard kept on the user-module branch.
 *
 * The full marketing/analytics dashboard (revenue charts, monthly targets…)
 * lives in the main app on the eventManagement / treasury branches, and
 * its widgets depend on data the user-service does not own.
 *
 * Here we surface a friendly landing page that:
 *   - greets the connected user by first name,
 *   - shows the four entry points relevant to the user module
 *     (profile, club, members, roles).
 *
 * That keeps the build self-contained and gives a teammate working on
 * authentication a coherent post-login screen.
 */
@Component({
  selector: 'app-ecommerce',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="space-y-6">
      <header class="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <h1 class="text-2xl font-bold text-gray-800 dark:text-white">
          Welcome back{{ firstName ? ', ' + firstName : '' }} 👋
        </h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          You are signed in as
          <span class="font-medium text-gray-700 dark:text-gray-300">{{ email || '—' }}</span>
          <span *ngIf="role" class="ml-1 rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700">
            {{ role }}
          </span>
        </p>
      </header>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <a *ngFor="let card of cards"
           [routerLink]="card.link"
           class="group rounded-2xl border border-gray-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-indigo-400 hover:shadow-lg dark:border-gray-800 dark:bg-white/[0.03]">
          <div class="text-3xl">{{ card.icon }}</div>
          <h3 class="mt-3 text-base font-semibold text-gray-800 dark:text-white">{{ card.title }}</h3>
          <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">{{ card.subtitle }}</p>
          <span class="mt-3 inline-block text-xs font-medium text-indigo-600 group-hover:translate-x-0.5">
            Open →
          </span>
        </a>
      </div>
    </section>
  `,
})
export class EcommerceComponent implements OnInit {
  firstName = '';
  email = '';
  role = '';

  readonly cards = [
    { icon: '👤', title: 'My profile',  subtitle: 'Edit personal info & photo', link: '/profile' },
    { icon: '🏛️', title: 'My clubs',    subtitle: 'Browse and manage clubs',    link: '/clubs' },
    { icon: '👥', title: 'Members',     subtitle: 'List and invite teammates',  link: '/users' },
    { icon: '🛡️', title: 'Roles',       subtitle: 'Configure roles & rights',  link: '/roles' },
  ];

  constructor(private auth: AuthService, private router: Router) {}

  ngOnInit(): void {
    const u: any = this.auth.getUser?.() ?? null;
    if (!u) {
      this.router.navigateByUrl('/signin');
      return;
    }
    this.firstName = u.firstName ?? '';
    this.email = u.email ?? '';
    this.role = u.role ?? '';
  }
}
