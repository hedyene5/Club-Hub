import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { VirtualEventService } from '../../services/virtual-event.service';
import { EmailService, EmailPayload } from '../../services/email.service';
import { VirtualEvent } from '../../models/virtual-event';

@Component({
  selector: 'app-events',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [DatePipe],
  templateUrl: './events.component.html'
})
export class EventsComponent implements OnInit, OnDestroy {
  events: VirtualEvent[] = [];
  selectedEvent: VirtualEvent | null = null;
  isModalOpen = false;

  selectedColor = 'blue';
  selectedType = 'cube';

  userId = '';
  currentUser: any = null;

  joinAccess: { [key: string]: boolean } = {};
  countdowns: { [key: string]: string } = {};

  interval: any;

  loading = false;
  successMsg = '';
  errorMsg = '';

  constructor(
    private virtualEventService: VirtualEventService,
    private emailService: EmailService,
    private datePipe: DatePipe,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadCurrentUser();
    this.loadEvents();

    this.interval = setInterval(() => {
      this.updateCountdowns();
    }, 1000);
  }

  ngOnDestroy() {
    clearInterval(this.interval);
  }

  loadCurrentUser() {
    const rawUser =
      localStorage.getItem('currentUser') ||
      localStorage.getItem('user');

    if (!rawUser) {
      console.warn('No user found in localStorage');
      return;
    }

    try {
      const parsed = JSON.parse(rawUser);

      // Supporte plusieurs formats possibles
      const nestedUser = parsed.user ?? parsed;

      this.currentUser = {
        userId: nestedUser.userId || nestedUser._id || nestedUser.id || '',
        firstName: nestedUser.firstName || '',
        lastName: nestedUser.lastName || '',
        email: nestedUser.email || '',
        token: nestedUser.token || parsed.token || ''
      };

      this.userId = this.currentUser.userId;

      console.log('Loaded currentUser:', this.currentUser);
    } catch (error) {
      console.error('Error parsing user from localStorage:', error);
    }
  }

  clearMessages() {
    setTimeout(() => {
      this.successMsg = '';
      this.errorMsg = '';
    }, 3000);
  }

  loadEvents() {
    this.virtualEventService.getAllEvents().subscribe({
      next: (data) => {
        this.events = data;
        this.loadJoinAccess();
        this.updateCountdowns();
      },
      error: (err) => {
        console.error('Error loading events:', err);
        this.errorMsg = 'Error while loading events';
        this.clearMessages();
      }
    });
  }

  loadJoinAccess() {
    if (!this.userId) return;

    this.events.forEach(event => {
      if (!event.id) return;

      this.virtualEventService.canJoin(event.id, this.userId).subscribe({
        next: (res) => {
          this.joinAccess[event.id!] = res;
        },
        error: (err) => {
          console.error(`canJoin error for event ${event.id}:`, err);
          this.joinAccess[event.id!] = false;
        }
      });
    });
  }

  updateCountdowns() {
    const now = new Date().getTime();

    this.events.forEach(event => {
      if (!event.id) return;

      const eventTime = new Date(event.scheduledAt).getTime();
      const diff = eventTime - now;

      if (diff <= 0) {
        this.countdowns[event.id] = '🔴 LIVE';
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);

      this.countdowns[event.id] = `${minutes}m ${seconds}s`;
    });
  }

  canUserJoin(event: VirtualEvent): boolean {
    if (!event.id) return false;

    const now = new Date().getTime();
    const eventTime = new Date(event.scheduledAt).getTime();
    const fiveMinBefore = eventTime - (5 * 60 * 1000);

    return !!this.joinAccess[event.id] && now >= fiveMinBefore;
  }

  isLive(event: VirtualEvent): boolean {
    const now = new Date().getTime();
    const eventTime = new Date(event.scheduledAt).getTime();
    return now >= eventTime;
  }

  getJoinMessage(event: VirtualEvent): string {
    if (!event.id) return 'Error';

    const now = new Date().getTime();
    const eventTime = new Date(event.scheduledAt).getTime();
    const fiveMinBefore = eventTime - (5 * 60 * 1000);

    if (!this.joinAccess[event.id]) {
      return '❌ You must register and pay first';
    }

    if (now < fiveMinBefore) {
      const minutesLeft = Math.ceil((fiveMinBefore - now) / 60000);
      return `⏳ Available in ${minutesLeft} min`;
    }

    if (now >= eventTime) {
      return '🔴 Event is live';
    }

    return '✅ You can join the event';
  }

  openEventDetails(event: VirtualEvent) {
    this.selectedEvent = event;
    this.isModalOpen = true;
    this.successMsg = '';
    this.errorMsg = '';
  }

  closeModal() {
    this.isModalOpen = false;
    this.selectedEvent = null;
    this.loading = false;
    this.successMsg = '';
    this.errorMsg = '';
  }

  registerToEvent(event: VirtualEvent) {
    if (!event?.id) {
      this.errorMsg = 'Invalid event';
      this.clearMessages();
      return;
    }

    if (!this.userId) {
      this.errorMsg = 'User not found';
      this.clearMessages();
      return;
    }

    if (!this.currentUser?.email) {
      this.errorMsg = 'User email not found';
      this.clearMessages();
      return;
    }

    this.loading = true;
    this.successMsg = '';
    this.errorMsg = '';

    // 1) inscription backend
    this.virtualEventService.register(event.id, this.userId).subscribe({
      next: () => {
        // 2) envoi email avec EmailService existant
        const payload: EmailPayload = {
          to: this.currentUser.email,
          userName:
            `${this.currentUser.firstName || ''} ${this.currentUser.lastName || ''}`.trim() || 'Participant',
          eventTitle: event.title || 'Event',
          eventDate: this.formatDate(event.scheduledAt),
          meetingLink: event.meetingLink || 'https://meet.jit.si/default-room'
        };

        this.emailService.testConfirmation(payload).subscribe({
          next: () => {
            this.loading = false;
            this.successMsg = `Successfully registered for ${event.title}. Confirmation email sent.`;
            this.loadEvents();
            this.clearMessages();
          },
          error: (mailErr) => {
            this.loading = false;
            console.error('Mail error:', mailErr);
            this.successMsg = `Registered for ${event.title}, but email was not sent.`;
            this.loadEvents();
            this.clearMessages();
          }
        });
      },
      error: (err) => {
        this.loading = false;
        console.error('Registration error:', err);
        this.errorMsg = err?.error?.message || err?.error?.error || 'Registration failed';
        this.clearMessages();
      }
    });
  }

  payForEvent(event: VirtualEvent) {
    if (!event?.id || !this.userId) {
      this.errorMsg = 'Invalid payment data';
      this.clearMessages();
      return;
    }

    this.loading = true;
    this.successMsg = '';
    this.errorMsg = '';

    this.virtualEventService.pay(event.id, this.userId).subscribe({
      next: () => {
        this.loading = false;
        this.successMsg = 'Payment successful';
        this.loadJoinAccess();
        this.clearMessages();
      },
      error: (err) => {
        this.loading = false;
        console.error('Payment error:', err);
        this.errorMsg = err?.error || 'Payment failed';
        this.clearMessages();
      }
    });
  }

  joinMeeting(event: VirtualEvent) {
    if (!this.canUserJoin(event)) {
      this.errorMsg = 'Access denied';
      this.clearMessages();
      return;
    }

    this.selectAvatar();

    if (event.type === 'ROOM') {
      localStorage.setItem('roomId', event.roomId!);
      this.router.navigate(['/lobby']);
    } else {
      this.router.navigate(['/meeting', event.id]);
    }

    this.closeModal();
  }

  selectAvatar() {
    const avatar = {
      color: this.selectedColor,
      type: this.selectedType
    };
    localStorage.setItem('avatar', JSON.stringify(avatar));
  }

  formatDate(dateStr: string): string {
    return this.datePipe.transform(dateStr, 'EEEE dd MMMM yyyy à HH:mm') || '';
  }
}