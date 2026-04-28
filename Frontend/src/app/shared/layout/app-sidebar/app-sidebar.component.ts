import { CommonModule } from '@angular/common';
import { Component, ElementRef, QueryList, ViewChildren, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';
import { SidebarService } from '../../services/sidebar.service';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { SafeHtmlPipe } from '../../pipe/safe-html.pipe';
import { SidebarWidgetComponent } from './app-sidebar-widget.component';
import { combineLatest, Subscription } from 'rxjs';
import { AuthService, CurrentUser } from '../../../shared/services/auth.service';
import { ClubService } from '../../services/club.service';
import { Club } from '../../../models/club.model';
import { MeetingPvService } from '../../services/meeting-pv.service';


type SubItem = { name: string; path: string; pro?: boolean; new?: boolean };
type NavItem = {
  name: string;
  icon: string;
  path?: string;
  new?: boolean;
  badge?: number;
  subItems?: SubItem[];
};

// ── Role helpers (unchanged) ──────────────────────────────────────────
function isSecretaireGenerale(role: string | undefined | null): boolean {
  if (!role) return false;
  const norm = role
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '_')
      .replace(/^_|_$/g, '');
  return norm === 'SECRETAIRE_GENERALE' || norm === 'SECRETAIRE_GENERAL';
}

function normaliseRole(role: string | undefined | null): string {
  if (!role) return '';
  return role
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '_')
      .replace(/^_|_$/g, '');
}

function isSimpleMemberRole(role: string | undefined | null): boolean {
  const norm = normaliseRole(role);
  if (!norm) return false;
  const bureauNorm = new Set([
    'PRESIDENT',
    'VICE_PRESIDENT',
    'SECRETAIRE_GENERALE',
    'SECRETAIRE_GENERAL',
    'TRESORIER',
    'TREASURER',
    'RH',
  ]);
  return !bureauNorm.has(norm);
}

type SidebarPermissions = {
  canViewMyClub: boolean;
  canViewCalendar: boolean;
  canManageEvents: boolean;
  canRsvpEvents: boolean;
  canAssignTasks: boolean;
  canViewMyTasks: boolean;
  canViewBorrowedItems: boolean;
  canManageLenders: boolean;
  canManageDevis: boolean;
  canManageMembers: boolean;
  canManageRoles: boolean;
  canManageClubSettings: boolean;
  canViewNotifications: boolean;
  canViewVirtualEvents: boolean;
};

const BUREAU_ROLES = ['PRESIDENT', 'VICE_PRESIDENT', 'SECRETAIRE_GENERALE', 'TRESORIER', 'RH'];
const CLUB_SETTINGS_ROLES = ['PRESIDENT', 'VICE_PRESIDENT'];
const TREASURER_ROLES = ['TRESORIER', 'TREASURER'];

@Component({
  selector: 'app-sidebar',
  imports: [CommonModule, RouterModule, SafeHtmlPipe, SidebarWidgetComponent],
  templateUrl: './app-sidebar.component.html',
})
export class AppSidebarComponent implements OnInit, OnDestroy {

  currentUser: CurrentUser | null = null;
  currentClub: Club | null = null;

  // ═══════════════════════════════════════════════════════════════
  //  BASE NAV ITEMS – paths updated to /app + Dashboard dropdown
  // ═══════════════════════════════════════════════════════════════
  private baseNavItems: NavItem[] = [
    // ── Dashboard dropdown ──
    {
      icon: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 12.2039C2 9.91549 2 8.77128 2.5192 7.82274C3.0384 6.87421 3.98695 6.28551 5.88403 5.10813L7.88403 3.86687C9.88939 2.62229 10.8921 2 12 2C13.1079 2 14.1106 2.62229 16.116 3.86687L18.116 5.10812C20.0131 6.28551 20.9616 6.87421 21.4808 7.82274C22 8.77128 22 9.91549 22 12.2039V13.725C22 17.6258 22 19.5763 20.8284 20.7881C19.6569 22 17.7712 22 14 22H10C6.22876 22 4.34315 22 3.17157 20.7881C2 19.5763 2 17.6258 2 13.725V12.2039Z" stroke="currentColor" stroke-width="1.5"/><path d="M15 18H9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
      name: 'Dashboard',
      subItems: [
        { name: 'Virtual Events', path: '/app/dashboard' },
        { name: 'Treasury',      path: '/app/treasury' }
      ],
    },
    // ── Calendar (back‑office) ──
    {
      icon: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 2V5M16 2V5M3.5 9.09H20.5M21 8.5V17C21 20 19.5 22 16 22H8C4.5 22 3 20 3 17V8.5C3 5.5 4.5 3.5 8 3.5H16C19.5 3.5 21 5.5 21 8.5Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M15.6947 13.7H15.7037M15.6947 16.7H15.7037M11.9955 13.7H12.0045M11.9955 16.7H12.0045M8.29431 13.7H8.30329M8.29431 16.7H8.30329" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
      name: 'Calendar',
      path: '/app/calendar',
    },
    // ── Virtual events (front‑office) ──
    {
      icon: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15 10L19.5528 7.72361C20.2177 7.39116 21 7.87465 21 8.61803V15.382C21 16.1253 20.2177 16.6088 19.5528 16.2764L15 14M7 18H11C12.1046 18 13 17.1046 13 16V8C13 6.89543 12.1046 6 11 6H7C5.89543 6 5 6.89543 5 8V16C5 17.1046 5.89543 18 7 18Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
      name: 'Virtual events',
      path: '/ameni/events',
    },
    // ── Transcriptions (front‑office) ──
    {
      icon: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15.7 11.2C15.7 13.133 14.133 14.7 12.2 14.7C10.267 14.7 8.7 13.133 8.7 11.2V6.5C8.7 4.567 10.267 3 12.2 3C14.133 3 15.7 4.567 15.7 6.5V11.2Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M5.5 10.5V11.2C5.5 14.9 8.5 17.9 12.2 17.9C15.9 17.9 18.9 14.9 18.9 11.2V10.5M12.2 17.9V21M8.5 21H15.9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
      name: 'Transcriptions',
      path: '/ameni/recordings',
    },
    // ── Instant Voice (back‑office) ──
    {
      icon: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 4a3 3 0 00-3 3v4a3 3 0 006 0V7a3 3 0 00-3-3z" stroke="currentColor" stroke-width="1.5"/><path d="M5 10v1a7 7 0 0014 0v-1M12 18v3M9 21h6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
      name: 'Instant Voice',
      subItems: [
        { name: 'Voice channels', path: '/app/voice2/instant-voice' },
        { name: 'Audio reports',  path: '/app/voice2/audio-reports' },
        { name: 'My reports',     path: '/app/voice2/my-reports' },
      ],
    },
    // ── All events (back‑office) ──
    {
      icon: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11 19.5H21M11 12H21M11 4.5H21M3 5.25C3 6.07843 3.67157 6.75 4.5 6.75C5.32843 6.75 6 6.07843 6 5.25C6 4.42157 5.32843 3.75 4.5 3.75C3.67157 3.75 3 4.42157 3 5.25ZM3 12C3 12.8284 3.67157 13.5 4.5 13.5C5.32843 13.5 6 12.8284 6 12C6 11.1716 5.32843 10.5 4.5 10.5C3.67157 10.5 3 11.1716 3 12ZM3 18.75C3 19.5784 3.67157 20.25 4.5 20.25C5.32843 20.25 6 19.5784 6 18.75C6 17.9216 5.32843 17.25 4.5 17.25C3.67157 17.25 3 17.9216 3 18.75Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
      name: 'All events',
      path: '/app/events',
    },
    // ── RSVP (back‑office) ──
    {
      icon: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12.37 8.88H17.62M6.38 8.88L7.13 9.63L9.38 7.38M12.37 15.88H17.62M6.38 15.88L7.13 16.63L9.38 14.38" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 22H15C20 22 22 20 22 15V9C22 4 20 2 15 2H9C4 2 2 4 2 9V15C2 20 4 22 9 22Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
      name: 'RSVP',
      path: '/app/rsvp',
    },
    // ── Gestion des Rôles (back‑office) ──
    {
      icon: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M10.4858 3.5L13.5182 3.5C13.9233 3.5 14.2518 3.82851 14.2518 4.23377C14.2518 5.9529 16.1129 7.02795 17.602 6.1682C17.9528 5.96567 18.4014 6.08586 18.6039 6.43667L20.1203 9.0631C20.3229 9.41407 20.2027 9.86286 19.8517 10.0655C18.3625 10.9253 18.3625 13.0747 19.8517 13.9345C20.2026 14.1372 20.3229 14.5859 20.1203 14.9369L18.6039 17.5634C18.4013 17.9142 17.9528 18.0344 17.602 17.8318C16.1129 16.9721 14.2518 18.0471 14.2518 19.7663C14.2518 20.1715 13.9233 20.5 13.5182 20.5H10.4858C10.0804 20.5 9.75182 20.1714 9.75182 19.766C9.75182 18.0461 7.88983 16.9717 6.40067 17.8314C6.04945 18.0342 5.60037 17.9139 5.39767 17.5628L3.88167 14.937C3.67903 14.586 3.79928 14.1372 4.15026 13.9346C5.63949 13.0748 5.63946 10.9253 4.15025 10.0655C3.79926 9.86282 3.67901 9.41401 3.88165 9.06303L5.39764 6.43725C5.60034 6.08617 6.04943 5.96581 6.40065 6.16858C7.88982 7.02836 9.75182 5.9539 9.75182 4.23399C9.75182 3.82862 10.0804 3.5 10.4858 3.5ZM13.5182 2L10.4858 2C9.25201 2 8.25182 3.00019 8.25182 4.23399C8.25182 4.79884 7.64013 5.15215 7.15065 4.86955C6.08213 4.25263 4.71559 4.61859 4.0986 5.68725L2.58261 8.31303C1.96575 9.38146 2.33183 10.7477 3.40025 11.3645C3.88948 11.647 3.88947 12.3531 3.40026 12.6355C2.33184 13.2524 1.96578 14.6186 2.58263 15.687L4.09863 18.3128C4.71562 19.3814 6.08215 19.7474 7.15067 19.1305C7.64015 18.8479 8.25182 19.2012 8.25182 19.766C8.25182 20.9998 9.25201 22 10.4858 22H13.5182C14.7519 22 15.7518 20.9998 15.7518 19.7663C15.7518 19.2015 16.3632 18.8487 16.852 19.1309C17.9202 19.7476 19.2862 19.3816 19.9029 18.3134L21.4193 15.6869C22.0361 14.6185 21.6701 13.2523 20.6017 12.6355C20.1125 12.3531 20.1125 11.647 20.6017 11.3645C21.6701 10.7477 22.0362 9.38152 21.4193 8.3131L19.903 5.68667C19.2862 4.61842 17.9202 4.25241 16.852 4.86917C16.3632 5.15138 15.7518 4.79856 15.7518 4.23377C15.7518 3.00024 14.7519 2 13.5182 2ZM9.6659 11.9999C9.6659 10.7103 10.7113 9.66493 12.0009 9.66493C13.2905 9.66493 14.3359 10.7103 14.3359 11.9999C14.3359 13.2895 13.2905 14.3349 12.0009 14.3349C10.7113 14.3349 9.6659 13.2895 9.6659 11.9999ZM12.0009 8.16493C9.88289 8.16493 8.1659 9.88191 8.1659 11.9999C8.1659 14.1179 9.88289 15.8349 12.0009 15.8349C14.1189 15.8349 15.8359 14.1179 15.8359 11.9999C15.8359 9.88191 14.1189 8.16493 12.0009 8.16493Z" fill="currentColor"></path></svg>`,
      name: "Gestion des Rôles",
      path: "/app/roles",
    },
    // ── Members (back‑office) ──
    {
      icon: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 7.16C17.94 7.15 17.87 7.15 17.81 7.16C16.43 7.11 15.33 5.98 15.33 4.58C15.33 3.15 16.48 2 17.91 2C19.34 2 20.49 3.16 20.49 4.58C20.48 5.98 19.38 7.11 18 7.16Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M16.97 14.44C18.34 14.67 19.85 14.43 20.91 13.72C22.32 12.78 22.32 11.24 20.91 10.3C19.84 9.59 18.31 9.35 16.94 9.59" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M5.97 7.16C6.03 7.15 6.1 7.15 6.16 7.16C7.54 7.11 8.64 5.98 8.64 4.58C8.64 3.15 7.49 2 6.06 2C4.63 2 3.48 3.16 3.48 4.58C3.49 5.98 4.59 7.11 5.97 7.16Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M7 14.44C5.63 14.67 4.12 14.43 3.06 13.72C1.65 12.78 1.65 11.24 3.06 10.3C4.13 9.59 5.66 9.35 7.03 9.59" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 14.63C11.94 14.62 11.87 14.62 11.81 14.63C10.43 14.58 9.33 13.45 9.33 12.05C9.33 10.62 10.48 9.47 11.91 9.47C13.34 9.47 14.49 10.63 14.49 12.05C14.48 13.45 13.38 14.59 12 14.63Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M9.09 17.78C7.68 18.72 7.68 20.26 9.09 21.2C10.69 22.27 13.31 22.27 14.91 21.2C16.32 20.26 16.32 18.72 14.91 17.78C13.32 16.72 10.69 16.72 9.09 17.78Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
      name: 'Members',
      subItems: [
        { name: 'Member list', path: '/app/members' },
      ],
    },
    // ── Tasks (back‑office) ──
    {
      icon: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12.37 8.88H17.62M6.38 8.88L7.13 9.63L9.38 7.38M12.37 15.88H17.62M6.38 15.88L7.13 16.63L9.38 14.38" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 22H15C20 22 22 20 22 15V9C22 4 20 2 15 2H9C4 2 2 4 2 9V15C2 20 4 22 9 22Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
      name: 'Tasks',
      subItems: [
        { name: 'Assign tasks', path: '/app/addTask' },
        { name: 'Manage tasks', path: '/app/tasks' },
      ],
    },
    // ── Procès-Verbaux (back‑office) ──
    {
      icon: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14 3v4a1 1 0 0 0 1 1h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 13h6M9 17h6M9 9h2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
      name: 'Procès-Verbaux',
      path: '/app/pv',
    },
    // ── Event Needs (back‑office) ──
    {
      icon: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 10H21M7 15H11M7 18H11M6.2 21H17.8C18.9201 21 19.4802 21 19.908 20.782C20.2843 20.5903 20.5903 20.2843 20.782 19.908C21 19.4802 21 18.9201 21 17.8V8.2C21 7.07989 21 6.51984 20.782 6.09202C20.5903 5.7157 20.2843 5.40974 19.908 5.21799C19.4802 5 18.9201 5 17.8 5H6.2C5.0799 5 4.51984 5 4.09202 5.21799C3.7157 5.40974 3.40974 5.7157 3.21799 6.09202C3 6.51984 3 7.0799 3 8.2V17.8C3 18.9201 3 19.4802 3.21799 19.908C3.40974 20.2843 3.7157 20.5903 4.09202 20.782C4.51984 21 5.07989 21 6.2 21Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M8 5V3M16 5V3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M12 14C13.1046 14 14 13.1046 14 12C14 10.8954 13.1046 10 12 10C10.8954 10 10 10.8954 10 12C10 13.1046 10.8954 14 12 14Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
      name: 'Event Needs',
      subItems: [
        { name: 'All needs',       path: '/app/borrowed-items' },
        { name: 'Lenders',         path: '/app/lenders' },
        { name: 'Quotes (Devis)',  path: '/app/borrowed-items' },
      ],
    },
  ];

  // ── Others items (My Profile + Front Office) ──
  othersItems: NavItem[] = [
    {
      icon: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M20.5899 22C20.5899 18.13 16.7399 15 11.9999 15C7.25991 15 3.40991 18.13 3.40991 22" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
      name: 'My Profile',
      path: '/app/profile',
    },
    {
      icon: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
      name: 'Front Office',
      path: '/',
    },
  ];

  // … (the rest of the class, properties, and methods remain exactly as before) …
  openSubmenu: string | null | number = null;
  subMenuHeights: { [key: string]: number } = {};
  @ViewChildren('subMenu') subMenuRefs!: QueryList<ElementRef>;

  readonly isExpanded$;
  readonly isMobileOpen$;
  readonly isHovered$;

  private subscription: Subscription = new Subscription();
  pendingPvCount = 0;

  constructor(
      public sidebarService: SidebarService,
      private router: Router,
      private cdr: ChangeDetectorRef,
      private authService: AuthService,
      private clubService: ClubService,
      private pvService: MeetingPvService
  ) {
    this.isExpanded$ = this.sidebarService.isExpanded$;
    this.isMobileOpen$ = this.sidebarService.isMobileOpen$;
    this.isHovered$ = this.sidebarService.isHovered$;
  }

  ngOnInit() {
    // [unchanged code omitted for brevity – use the same ngOnInit as before]
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  private get permissions(): SidebarPermissions {
    // [unchanged code omitted for brevity – use the same permissions code as before]
    return {} as any; // placeholder – copy your existing implementation
  }

  public navItems: NavItem[] = [];
  public visibleOthersItems: NavItem[] = [];

  private updateNavItems(): void {
    const clubId = this.currentUser?.clubId;
    const clubName = this.currentClub?.name ?? 'Mon Club';
    const p = this.permissions;

    const monClubItem: NavItem = {
      icon: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 21H3M19 21V7C19 5.89543 18.1046 5 17 5H7C5.89543 5 5 5.89543 5 7V21M9 21V17C9 15.8954 9.89543 15 11 15H13C14.1046 15 15 15.8954 15 17V21M17 5V4C17 2.89543 16.1046 2 15 2H9C7.89543 2 7 2.89543 7 4V5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
      name: clubName,
      path: clubId ? `/app/clubs/${clubId}` : '/app/clubs'   // ⚡ UPDATED
    };

    const items: NavItem[] = [];
    if (this.currentUser?.role === 'PRESIDENT') {
      items.push(this.baseNavItems[0]);   // Dashboard dropdown
    }

    if (p.canViewMyClub) items.push(monClubItem);

    for (let i = 1; i < this.baseNavItems.length; i++) {
      const filtered = this.filterItem(this.baseNavItems[i], p);
      if (filtered) items.push(filtered);
    }
    this.navItems = items;

    this.visibleOthersItems = this.othersItems.map(item => {
      if (item.name === 'Club Settings' && clubId) {
        return { ...item, path: `/app/clubs/${clubId}/edit` };
      }
      return item;
    }).filter(item =>
        item.name !== 'Club Settings' || p.canManageClubSettings
    );
  }
  /**
   * Filtre un item du sidebar selon les permissions.
   * Filtre aussi finement les sous-éléments (un membre du comité peut voir
   * "Tasks" mais uniquement le sous-item "Manage tasks", pas "Assign tasks").
   */
  private filterItem(item: NavItem, p: SidebarPermissions): NavItem | null {
    switch (item.name) {
      case 'Dashboard':
        return item; // Always visible if logged in

      case 'Calendar':
      case 'All events':
        return p.canViewCalendar ? item : null;

      case 'Virtual events':
        return p.canViewVirtualEvents ? item : null;

      case 'Transcriptions':
        return p.canViewCalendar ? item : null;

      case 'Instant Voice':
        const role = this.currentUser?.role ?? '';
        const isSimple = isSimpleMemberRole(role);
        const filteredVoiceSubItems = (item.subItems ?? []).filter((sub) => {
          if (sub.path === '/voice2/audio-reports') return !isSimple;
          if (sub.path === '/voice2/my-reports') return isSimple;
          return true;
        });
        return filteredVoiceSubItems.length ? { ...item, subItems: filteredVoiceSubItems } : null;

      case 'RSVP':
        return p.canRsvpEvents ? item : null;

      case 'Tasks': {
        const subItems = (item.subItems ?? []).filter(sub => {
          switch (sub.name) {
            case 'Assign tasks':  return p.canAssignTasks;
            case 'Manage tasks':  return p.canViewMyTasks;
            default:              return false;
          }
        });
        return subItems.length ? { ...item, subItems } : null;
      }

      case 'Event Needs': {
        const subItems = (item.subItems ?? []).filter(sub => {
          switch (sub.name) {
            case 'All needs':       return p.canViewBorrowedItems;
            case 'Lenders':         return p.canManageLenders;
            case 'Quotes (Devis)':  return p.canManageDevis;
            default:                return false;
          }
        });
        return subItems.length ? { ...item, subItems } : null;
      }

      case 'Members':
        return p.canManageMembers ? item : null;

      case 'Gestion des Rôles':
        return p.canManageRoles ? item : null;

      case 'Procès-Verbaux':
        // Only the secretary general sees this section. We attach the
        // pending-PV count here so the existing template renders a badge
        // without further plumbing.
        return isSecretaireGenerale(this.currentUser?.role)
          ? { ...item, badge: this.pendingPvCount || undefined }
          : null;


      default:
        return item;
    }
  }


  isActive(path: string): boolean {
    return this.router.url === path;
  }

  toggleSubmenu(section: string, index: number) {
    const key = `${section}-${index}`;

    if (this.openSubmenu === key) {
      this.openSubmenu = null;
      this.subMenuHeights[key] = 0;
    } else {
      this.openSubmenu = key;

      setTimeout(() => {
        const el = document.getElementById(key);
        if (el) {
          this.subMenuHeights[key] = el.scrollHeight;
          this.cdr.detectChanges();
        }
      });
    }
  }

  onSidebarMouseEnter() {
    this.isExpanded$.subscribe(expanded => {
      if (!expanded) {
        this.sidebarService.setHovered(true);
      }
    }).unsubscribe();
  }

  private setActiveMenuFromRoute(currentUrl: string) {
    const menuGroups = [
      { items: this.navItems, prefix: 'main' },
      { items: this.visibleOthersItems, prefix: 'others' },
    ];

    menuGroups.forEach(group => {
      group.items.forEach((nav, i) => {
        if (nav.subItems) {
          nav.subItems.forEach(subItem => {
            if (currentUrl === subItem.path) {
              const key = `${group.prefix}-${i}`;
              this.openSubmenu = key;

              setTimeout(() => {
                const el = document.getElementById(key);
                if (el) {
                  this.subMenuHeights[key] = el.scrollHeight;
                  this.cdr.detectChanges();
                }
              });
            }
          });
        }
      });
    });
  }

  onSubmenuClick() {
    this.isMobileOpen$.subscribe(isMobile => {
      if (isMobile) {
        this.sidebarService.setMobileOpen(false);
      }
    }).unsubscribe();
  }
}
