import { CommonModule } from '@angular/common';
import { Component, ElementRef, QueryList, ViewChildren, ChangeDetectorRef, inject } from '@angular/core';
import { SidebarService } from '../../services/sidebar.service';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { SafeHtmlPipe } from '../../pipe/safe-html.pipe';
import { SidebarWidgetComponent } from './app-sidebar-widget.component';
import { combineLatest, Subscription } from 'rxjs';
import { AuthService } from '../../../treasury/services/auth.service';

type NavItem = {
  name: string;
  icon: string;
  path?: string;
  new?: boolean;
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
};

@Component({
  selector: 'app-sidebar',
  imports: [
    CommonModule,
    RouterModule,
    SafeHtmlPipe,
    SidebarWidgetComponent
  ],
  templateUrl: './app-sidebar.component.html',
})
export class AppSidebarComponent {

  // ── SVG Icons ──────────────────────────────────────────────────────
  private readonly ICON_DASHBOARD = `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" fill="currentColor"/></svg>`;
  private readonly ICON_COTISATIONS = `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2ZM12.75 7C12.75 6.58579 12.4142 6.25 12 6.25C11.5858 6.25 11.25 6.58579 11.25 7V7.54987C9.96832 7.8531 9 8.91538 9 10.25C9 11.7688 10.2312 13 11.75 13H12.25C12.9404 13 13.5 13.5596 13.5 14.25C13.5 14.9404 12.9404 15.5 12.25 15.5H10.5C9.80964 15.5 9.25 14.9404 9.25 14.25C9.25 13.8358 8.91421 13.5 8.5 13.5C8.08579 13.5 7.75 13.8358 7.75 14.25C7.75 15.5845 8.71687 16.6865 10 16.9696V17C10 17.4142 10.3358 17.75 10.75 17.75C11.1642 17.75 11.5 17.4142 11.5 17V16.9499C12.7506 16.6406 13.75 15.5614 13.75 14.25C13.75 12.7312 12.5188 11.5 11 11.5H10.5C9.80964 11.5 9.25 10.9404 9.25 10.25C9.25 9.55964 9.80964 9 10.5 9H13.5C14.1904 9 14.75 9.55964 14.75 10.25C14.75 10.6642 15.0858 11 15.5 11C15.9142 11 16.25 10.6642 16.25 10.25C16.25 8.9155 15.2831 7.81355 14 7.5V7C14 6.58579 13.6642 6.25 13.25 6.25C12.8358 6.25 12.5 6.58579 12.5 7H12.75Z" fill="currentColor"/></svg>`;
  private readonly ICON_DEPENSES = `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z" fill="currentColor"/></svg>`;
  private readonly ICON_IA = `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" fill="currentColor"/></svg>`;
  private readonly ICON_LOGIN = `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11 7L9.6 8.4l2.6 2.6H2v2h10.2l-2.6 2.6L11 17l5-5-5-5zm9 12h-8v2h8c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-8v2h8v14z" fill="currentColor"/></svg>`;
  private readonly ICON_ESPACE = `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" fill="currentColor"/></svg>`;

  // ClubHub — menu principal (dynamique selon le role)
  navItems: NavItem[] = [];

  // ClubHub — section secondaire
  othersItems: NavItem[] = [
    {
      icon: `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M12 3.5C7.30558 3.5 3.5 7.30558 3.5 12C3.5 14.1526 4.3002 16.1184 5.61936 17.616C6.17279 15.3096 8.24852 13.5955 10.7246 13.5955H13.2746C15.7509 13.5955 17.8268 15.31 18.38 17.6167C19.6996 16.119 20.5 14.153 20.5 12C20.5 7.30558 16.6944 3.5 12 3.5ZM17.0246 18.8566V18.8455C17.0246 16.7744 15.3457 15.0955 13.2746 15.0955H10.7246C8.65354 15.0955 6.97461 16.7744 6.97461 18.8455V18.856C8.38223 19.8895 10.1198 20.5 12 20.5C13.8798 20.5 15.6171 19.8898 17.0246 18.8566ZM2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12ZM11.9991 7.25C10.8847 7.25 9.98126 8.15342 9.98126 9.26784C9.98126 10.3823 10.8847 11.2857 11.9991 11.2857C13.1135 11.2857 14.0169 10.3823 14.0169 9.26784C14.0169 8.15342 13.1135 7.25 11.9991 7.25ZM8.48126 9.26784C8.48126 7.32499 10.0563 5.75 11.9991 5.75C13.9419 5.75 15.5169 7.32499 15.5169 9.26784C15.5169 11.2107 13.9419 12.7857 11.9991 12.7857C10.0563 12.7857 8.48126 11.2107 8.48126 9.26784Z" fill="currentColor"></path></svg>`,
      name: "Mon Profil",
      path: "/profile",
    },
  ];

  openSubmenu: string | null | number = null;
  subMenuHeights: { [key: string]: number } = {};
  @ViewChildren('subMenu') subMenuRefs!: QueryList<ElementRef>;

  readonly isExpanded$;
  readonly isMobileOpen$;
  readonly isHovered$;

  private subscription: Subscription = new Subscription();

  private auth = inject(AuthService);

  constructor(
    public sidebarService: SidebarService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.isExpanded$ = this.sidebarService.isExpanded$;
    this.isMobileOpen$ = this.sidebarService.isMobileOpen$;
    this.isHovered$ = this.sidebarService.isHovered$;
  }

  ngOnInit() {
    // Subscribe to router events
    this.subscription.add(
      this.router.events.subscribe(event => {
        if (event instanceof NavigationEnd) {
          this.setActiveMenuFromRoute(this.router.url);
        }
      })
    );

    // Subscribe to combined observables to close submenus when all are false
    this.subscription.add(
      combineLatest([this.isExpanded$, this.isMobileOpen$, this.isHovered$]).subscribe(
        ([isExpanded, isMobileOpen, isHovered]) => {
          if (!isExpanded && !isMobileOpen && !isHovered) {
            // this.openSubmenu = null;
            // this.savedSubMenuHeights = { ...this.subMenuHeights };
            // this.subMenuHeights = {};
            this.cdr.detectChanges();
          } else {
            // Restore saved heights when reopening
            // this.subMenuHeights = { ...this.savedSubMenuHeights };
            // this.cdr.detectChanges();
          }
        }
      )
    );

    // Subscribe to user changes to rebuild menu based on role
    this.subscription.add(
      this.auth.user$.subscribe((user: any) => {
        this.navItems = this.getNavItems(user?.role ?? null);
        this.openSubmenu = null;
        this.subMenuHeights = {};
        this.setActiveMenuFromRoute(this.router.url);
        this.cdr.detectChanges();
      })
    );

    // Initial load
    this.navItems = this.getNavItems(this.auth.current()?.role ?? null);
    this.setActiveMenuFromRoute(this.router.url);
  }

  /** Build the sidebar menu based on the user's role. */
  private getNavItems(role: string | null): NavItem[] {
    // Not logged in
    if (!role) {
      return [
        { icon: this.ICON_LOGIN, name: 'Connexion', path: '/signin' },
      ];
    }

    // MEMBRE_SIMPLE — limited front-office menu
    if (role === 'MEMBRE_SIMPLE') {
      return [
        { icon: this.ICON_ESPACE, name: 'Mon espace', path: '/treasury/espace-membre' },
        {
          icon: this.ICON_COTISATIONS,
          name: 'Cotisations',
          subItems: [
            { name: 'Payer ma cotisation', path: '/treasury/payer-cotisation' },
            { name: 'Mes paiements', path: '/treasury/mes-paiements' },
          ],
        },
        {
          icon: this.ICON_DEPENSES,
          name: 'Mes demandes',
          subItems: [
            { name: 'Soumettre depense', path: '/treasury/demande-depense' },
            { name: 'Mes notifications', path: '/treasury/mes-notifications' },
          ],
        },
      ];
    }

    // TRESORIER / PRESIDENT / VICE_PRESIDENT / SECRETAIRE_GENERALE / RH — full back-office
    return [
      { icon: this.ICON_DASHBOARD, name: 'Dashboard', path: '/treasury' },
      {
        icon: this.ICON_COTISATIONS,
        name: 'Cotisations',
        subItems: [
          { name: 'Gestion cotisations', path: '/treasury/cotisations' },
          { name: 'Remboursements', path: '/treasury/remboursements' },
        ],
      },
      {
        icon: this.ICON_DEPENSES,
        name: 'Depenses & Budget',
        subItems: [
          { name: 'Liste depenses', path: '/treasury/depenses' },
          { name: 'Budget', path: '/treasury/budget' },
          { name: 'Rapports & Bilans', path: '/treasury/rapports' },
          { name: 'Audit', path: '/treasury/audit' },
        ],
      },
      {
        icon: this.ICON_IA,
        name: 'IA & Alertes',
        subItems: [
          { name: 'Predictions', path: '/treasury/predictions' },
          { name: 'Anomalies', path: '/treasury/anomalies' },
          { name: 'Assistant IA', path: '/treasury/chatbot' },
          { name: 'Notifications', path: '/treasury/mes-notifications' },
        ],
      },
    ];
  }

  ngOnDestroy() {
    // Clean up subscriptions
    this.subscription.unsubscribe();
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
          this.cdr.detectChanges(); // Ensure UI updates
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
      { items: this.othersItems, prefix: 'others' },
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
                  this.cdr.detectChanges(); // Ensure UI updates
                }
              });
            }
          });
        }
      });
    });
  }

  onSubmenuClick() {
    console.log('click submenu');
    this.isMobileOpen$.subscribe(isMobile => {
      if (isMobile) {
        this.sidebarService.setMobileOpen(false);
      }
    }).unsubscribe();
  }  

  
}
