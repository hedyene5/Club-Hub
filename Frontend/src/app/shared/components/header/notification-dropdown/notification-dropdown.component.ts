import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { DropdownComponent } from '../../ui/dropdown/dropdown.component';
import {
  AppNotification,
  NotificationService
} from '../../../services/notification.service';

/**
 * Header bell icon + dropdown.
 *
 * Subscribes to {@link NotificationService} which polls the backend every
 * 60s and feeds every consumer through a single BehaviorSubject. Items are
 * computed server-side from domain state (e.g. completed events that still
 * lack a PV for the SECRETAIRE_GENERALE), so there is no per-user inbox to
 * maintain — the feed always reflects "what's actionable right now".
 */
@Component({
  selector: 'app-notification-dropdown',
  standalone: true,
  templateUrl: './notification-dropdown.component.html',
  imports: [CommonModule, RouterModule, DropdownComponent]
})
export class NotificationDropdownComponent implements OnInit, OnDestroy {
  isOpen = false;
  /** Pulses the orange dot until the user opens the dropdown at least once. */
  notifying = false;

  notifications: AppNotification[] = [];
  unreadCount = 0;

  private sub: Subscription | null = null;

  constructor(
    private notifService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.notifService.startPolling();
    this.sub = this.notifService.observe().subscribe(feed => {
      this.notifications = feed.items;
      this.unreadCount = feed.unread;
      // Only pulse the dot when there's something fresh to show.
      this.notifying = feed.unread > 0 && !this.isOpen;
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  toggleDropdown(): void {
    this.isOpen = !this.isOpen;
    if (this.isOpen) this.notifying = false;
  }

  closeDropdown(): void {
    this.isOpen = false;
  }

  openNotification(n: AppNotification): void {
    this.closeDropdown();
    if (n.link) this.router.navigate([n.link]);
  }

  /** Tailwind colour classes for the severity dot on each row. */
  severityDotClass(n: AppNotification): string {
    switch (n.severity) {
      case 'warning': return 'bg-orange-400';
      case 'success': return 'bg-emerald-500';
      default:        return 'bg-blue-500';
    }
  }

  /** Big emoji used in lieu of an avatar (no per-user picture for system notifs). */
  iconFor(n: AppNotification): string {
    switch (n.type) {
      case 'pv-pending':  return '📄';
      case 'pv-overdue':  return '⏰';
      default:            return '🔔';
    }
  }
}
