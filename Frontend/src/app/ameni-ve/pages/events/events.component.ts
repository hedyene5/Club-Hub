import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { VirtualEventService } from '../../services/virtual-event.service';
import { EmailService, EmailPayload } from '../../services/email.service';
import { VirtualEvent } from '../../models/virtual-event';
import { AuthService } from '../../../shared/services/auth.service';
import { CommitteeResponsableService } from '../../../shared/services/committee-responsable.service';

@Component({
  selector: 'app-events',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
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
  initialized = false;

  constructor(
    private virtualEventService: VirtualEventService,
    private emailService: EmailService,
    private datePipe: DatePipe,
    private router: Router,
    public authService: AuthService,
    public committeeResponsableService: CommitteeResponsableService
  ) {}

  ngOnInit(): void {
    this.committeeResponsableService.responsableStatus$.subscribe(status => {
      if (status === null) return; // Still loading

      if (!this.canAccess()) {
        console.warn("Accès refusé aux événements virtuels");
        this.router.navigate(['/dashboard']);
        return;
      }

      if (!this.initialized) {
        this.initialized = true;
        this.loadCurrentUser();
        this.loadEvents();

        this.interval = setInterval(() => {
          this.updateCountdowns();
        }, 1000);
      }
    });
  }

  canAccess(): boolean {
    if (this.authService.getCurrentRole() === 'PRESIDENT') return true;
    const isResponsable = this.committeeResponsableService.isResponsable();
    const groupName = (this.committeeResponsableService.getMySubGroupName() || '').toLowerCase();
    const isRespEvents = isResponsable && (groupName.includes('event') || groupName.includes('evenement'));

    // Accès pour Responsable Events OU Membre Simple
    return isRespEvents || this.authService.isMember();
  }

  ngOnDestroy(): void {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }

  loadCurrentUser(): void {
    const rawUser =
      localStorage.getItem('currentUser') ||
      localStorage.getItem('user');

    if (!rawUser) {
      console.warn('No user found in localStorage');
      return;
    }

    try {
      const parsed = JSON.parse(rawUser);
      const nestedUser = parsed.user ?? parsed;

      this.currentUser = {
        userId: nestedUser.userId || nestedUser._id || nestedUser.id || '',
        firstName: nestedUser.firstName || '',
        lastName: nestedUser.lastName || '',
        email: nestedUser.email || '',
        token: nestedUser.token || parsed.token || ''
      };

      this.userId = this.currentUser.userId;
    } catch (error) {
      console.error('Error parsing user:', error);
    }
  }

  loadEvents(): void {
    this.virtualEventService.getAllEvents().subscribe({
      next: (data) => {
        this.events = data || [];
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

  loadJoinAccess(): void {
    if (!this.userId) return;

    this.events.forEach(event => {
      if (!event.id) return;

      this.virtualEventService.canJoin(event.id, this.userId).subscribe({
        next: (res) => {
          this.joinAccess[event.id!] = res === true;
        },
        error: (err) => {
          console.error('canJoin error:', err);
          this.joinAccess[event.id!] = false;
        }
      });
    });
  }

  updateCountdowns(): void {
    const now = new Date().getTime();

    this.events.forEach(event => {
      if (!event.id || !event.scheduledAt) return;

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
    if (!event?.id || !event.scheduledAt) return false;

    const now = new Date().getTime();
    const eventTime = new Date(event.scheduledAt).getTime();
    const fiveMinBefore = eventTime - 5 * 60 * 1000;

    return this.joinAccess[event.id] === true && now >= fiveMinBefore;
  }

  isLive(event: VirtualEvent): boolean {
    if (!event?.scheduledAt) return false;

    const now = new Date().getTime();
    const eventTime = new Date(event.scheduledAt).getTime();

    return now >= eventTime;
  }

  getJoinMessage(event: VirtualEvent): string {
    if (!event?.id || !event.scheduledAt) return 'Invalid event';

    const now = new Date().getTime();
    const eventTime = new Date(event.scheduledAt).getTime();
    const fiveMinBefore = eventTime - 5 * 60 * 1000;

    if (this.joinAccess[event.id] !== true) {
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

  openEventDetails(event: VirtualEvent): void {
    this.selectedEvent = event;
    this.isModalOpen = true;
    this.successMsg = '';
    this.errorMsg = '';
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.selectedEvent = null;
    this.loading = false;
    this.successMsg = '';
    this.errorMsg = '';
  }

  registerToEvent(event: VirtualEvent): void {
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

    this.virtualEventService.register(event.id, this.userId).subscribe({
      next: () => {
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
          error: (mailErr: unknown) => {
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

  payForEvent(event: VirtualEvent): void {
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
        this.errorMsg = err?.error?.message || err?.error || 'Payment failed';
        this.clearMessages();
      }
    });
  }

  joinMeeting(event: VirtualEvent): void {
    if (!event?.id) {
      this.errorMsg = 'Invalid event';
      this.clearMessages();
      return;
    }

    if (!this.canUserJoin(event)) {
      this.errorMsg = 'Access denied. Register/pay first or wait until 5 minutes before the event.';
      this.clearMessages();
      return;
    }

    this.selectAvatar();

    const roomId = event.roomId?.trim();
    if (roomId) {
      localStorage.setItem('roomId', roomId);
      this.router.navigate(['/ameni/lobby', roomId]);
    } else {
      this.router.navigate(['/ameni/meeting', event.id!]);
    }

    this.closeModal();
  }

  selectAvatar(): void {
    const avatar = {
      color: this.selectedColor,
      type: this.selectedType
    };

    localStorage.setItem('avatar', JSON.stringify(avatar));
  }

  formatDate(dateStr: string): string {
    return this.datePipe.transform(dateStr, 'EEEE dd MMMM yyyy à HH:mm') || '';
  }

  canCreateEvents(): boolean {
    return this.authService.isBureau() || this.committeeResponsableService.isResponsable();
  }

  clearMessages(): void {
    setTimeout(() => {
      this.successMsg = '';
      this.errorMsg = '';
    }, 3000);
  }
}