import { Component, ElementRef, ViewChild, HostListener, OnInit, OnDestroy, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { SidebarService } from '../../services/sidebar.service';
import { Subscription } from 'rxjs';
import { SafeHtmlPipe } from '../../pipe/safe-html.pipe';

// Functional components from your original header
import { ThemeToggleButtonComponent } from '../../components/common/theme-toggle/theme-toggle-button.component';
import { NotificationDropdownComponent } from '../../components/header/notification-dropdown/notification-dropdown.component';
import { UserDropdownComponent } from '../../components/header/user-dropdown/user-dropdown.component';

type NavItem = {
  name: string;
  icon: string;
  path?: string;
  subItems?: { name: string; path: string }[];
};

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    SafeHtmlPipe,
    ThemeToggleButtonComponent,
    NotificationDropdownComponent,
    UserDropdownComponent
  ],
  templateUrl: './app-sidebar.component.html',
})
export class AppSidebarComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;
  
  navItems: NavItem[] = [
    { name: 'Dashboard', icon: '<svg>...</svg>', path: '/' },
    // ... add your other nav items here ...
  ];

  openSubmenu: string | null = null;
  private subscription: Subscription = new Subscription();

  constructor(
    private router: Router, 
    private cdr: ChangeDetectorRef,
    public sidebarService: SidebarService 
  ) {}

  ngOnInit() {
    this.subscription.add(
      this.router.events.subscribe(event => {
        if (event instanceof NavigationEnd) {
          this.openSubmenu = null;
        }
      })
    );
  }

  ngAfterViewInit() {
    document.addEventListener('keydown', this.handleKeyDown);
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    document.removeEventListener('keydown', this.handleKeyDown);
  }

  handleKeyDown = (event: KeyboardEvent) => {
    if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
      event.preventDefault();
      this.searchInput?.nativeElement.focus();
    }
  };

  toggleSubmenu(index: number) {
    const key = `nav-${index}`;
    this.openSubmenu = this.openSubmenu === key ? null : key;
  }

  @HostListener('document:click', ['$event'])
  clickout(event: any) {
    if (!event.target.closest('.relative')) {
      this.openSubmenu = null;
    }
  }

  handleToggle() {
    this.sidebarService.toggleMobileOpen();
  }
}