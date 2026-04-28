import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { VirtualEventService } from '../../services/virtual-event.service';
import { EmailService, EmailPayload } from '../../services/email.service';
import { EventReviewService, EventReview, ReviewSummary } from '../../services/event-review.service';
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

  reviews: EventReview[] = [];
  reviewSummary: ReviewSummary = { averageRating: 0, totalReviews: 0 };
  selectedRating = 0;
  reviewComment = '';

  constructor(
    private virtualEventService: VirtualEventService,
    private emailService: EmailService,
    private eventReviewService: EventReviewService,
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

    if (!rawUser) return;

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
        error: () => {
          this.joinAccess[event.id!] = false;
        }
      });
    });
  }

  updateCountdowns() {
    const now = new Date().getTime();

    this.events.forEach(event => {
      if (!event.id) return;

      const startTime = new Date(event.scheduledAt).getTime();
      const diff = startTime - now;

      if (this.isEventFinished(event)) {
        this.countdowns[event.id] = '✅ FINISHED';
        return;
      }

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

    if (this.isEventFinished(event)) return false;

    const now = new Date().getTime();
    const eventTime = new Date(event.scheduledAt).getTime();
    const fiveMinBefore = eventTime - (5 * 60 * 1000);

    return !!this.joinAccess[event.id] && now >= fiveMinBefore;
  }

  isLive(event: VirtualEvent): boolean {
    if (this.isEventFinished(event)) return false;

    const now = new Date().getTime();
    const startTime = new Date(event.scheduledAt).getTime();

    if (event.endAt) {
      const endTime = new Date(event.endAt).getTime();
      return now >= startTime && now < endTime;
    }

    return now >= startTime;
  }

  isEventFinished(event: VirtualEvent | null): boolean {
    if (!event?.scheduledAt) return false;

    const now = new Date().getTime();

    if (event.endAt) {
      return now >= new Date(event.endAt).getTime();
    }

    const startTime = new Date(event.scheduledAt).getTime();

    // fallback: si tu n’as pas endAt, on considère fini après 2 heures
    const defaultDurationMs = 2 * 60 * 60 * 1000;
    return now >= startTime + defaultDurationMs;
  }

  getJoinMessage(event: VirtualEvent): string {
    if (!event.id) return 'Error';

    if (this.isEventFinished(event)) {
      return '✅ Event finished — you can leave a review';
    }

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
    this.selectedRating = 0;
    this.reviewComment = '';

    if (event.id) {
      this.loadReviews(event.id);
    }
  }

  closeModal() {
    this.isModalOpen = false;
    this.selectedEvent = null;
    this.loading = false;
    this.successMsg = '';
    this.errorMsg = '';
    this.selectedRating = 0;
    this.reviewComment = '';
    this.reviews = [];
    this.reviewSummary = { averageRating: 0, totalReviews: 0 };
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
          error: () => {
            this.loading = false;
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

  // REVIEWS

  setRating(star: number) {
    if (!this.isEventFinished(this.selectedEvent)) return;
    this.selectedRating = star;
  }

  loadReviews(eventId: string) {
    this.eventReviewService.getReviews(eventId).subscribe({
      next: (data) => {
        this.reviews = data;
      },
      error: (err) => {
        console.error('Error loading reviews:', err);
      }
    });

    this.eventReviewService.getSummary(eventId).subscribe({
      next: (data) => {
        this.reviewSummary = data;
      },
      error: (err) => {
        console.error('Error loading review summary:', err);
      }
    });
  }

  submitReview() {
    if (!this.selectedEvent?.id) {
      this.errorMsg = 'Invalid event';
      this.clearMessages();
      return;
    }

    if (!this.isEventFinished(this.selectedEvent)) {
      this.errorMsg = 'You can review this event only after it ends';
      this.clearMessages();
      return;
    }

    if (!this.userId) {
      this.errorMsg = 'User not found';
      this.clearMessages();
      return;
    }

    if (this.selectedRating < 1 || this.selectedRating > 5) {
      this.errorMsg = 'Please select a rating';
      this.clearMessages();
      return;
    }

    if (!this.reviewComment.trim()) {
      this.errorMsg = 'Please write a comment';
      this.clearMessages();
      return;
    }

    const userName =
      `${this.currentUser?.firstName || ''} ${this.currentUser?.lastName || ''}`.trim()
      || this.currentUser?.name
      || 'User';

    const payload: EventReview = {
      eventId: this.selectedEvent.id,
      userId: this.userId,
      userName,
      rating: this.selectedRating,
      comment: this.reviewComment.trim()
    };

    this.eventReviewService.addReview(payload).subscribe({
      next: (review) => {
        if (review.flagged) {
          this.successMsg = 'Review submitted but flagged for moderation: ' + (review.reason || 'inappropriate content');
        } else {
          this.successMsg = 'Review submitted successfully';
        }
        this.selectedRating = 0;
        this.reviewComment = '';
        this.loadReviews(this.selectedEvent!.id!);
        this.clearMessages();
      },
      error: (err) => {
        console.error('Review error:', err);
        this.errorMsg = err?.error || 'Failed to submit review';
        this.clearMessages();
      }
    });
  }
}