import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { VirtualEventService } from '../../services/virtual-event.service';
import { VirtualEvent } from '../../models/virtual-event';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

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

  userId = "1";

  joinAccess: { [key: string]: boolean } = {};
  countdowns: { [key: string]: string } = {};

  interval: any;

  constructor(
    private virtualEventService: VirtualEventService,
    private datePipe: DatePipe,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadEvents();

    this.interval = setInterval(() => {
      this.updateCountdowns();
    }, 1000);
  }

  ngOnDestroy() {
    clearInterval(this.interval);
  }

  loadEvents() {
    this.virtualEventService.getAllEvents().subscribe({
      next: (data) => {
        this.events = data;
        this.loadJoinAccess();
        this.updateCountdowns();
      }
    });
  }

  loadJoinAccess() {
    this.events.forEach(event => {
      if (!event.id) return;

      this.virtualEventService.canJoin(event.id, this.userId)
        .subscribe(res => {
          this.joinAccess[event.id!] = res;
        });
    });
  }

  // 🔥 COUNTDOWN
  updateCountdowns() {
    const now = new Date().getTime();

    this.events.forEach(event => {
      const eventTime = new Date(event.scheduledAt).getTime();
      const diff = eventTime - now;

      if (diff <= 0) {
        this.countdowns[event.id!] = "🔴 LIVE";
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);

      this.countdowns[event.id!] = `${minutes}m ${seconds}s`;
    });
  }

  // 🔥 JOIN CONDITIONS
  canUserJoin(event: VirtualEvent): boolean {
    if (!event.id) return false;

    const now = new Date().getTime();
    const eventTime = new Date(event.scheduledAt).getTime();
    const fiveMinBefore = eventTime - (5 * 60 * 1000);

    return this.joinAccess[event.id] && now >= fiveMinBefore;
  }

  // 🔴 LIVE
  isLive(event: VirtualEvent): boolean {
    const now = new Date().getTime();
    const eventTime = new Date(event.scheduledAt).getTime();
    return now >= eventTime;
  }

  // 💬 MESSAGE INTELLIGENT
  getJoinMessage(event: VirtualEvent): string {

    if (!event.id) return "Erreur";

    const now = new Date().getTime();
    const eventTime = new Date(event.scheduledAt).getTime();
    const fiveMinBefore = eventTime - (5 * 60 * 1000);

    // ❌ pas inscrit / payé
    if (!this.joinAccess[event.id]) {
      return "❌ Vous devez vous inscrire et payer";
    }

    // ⏳ trop tôt
    if (now < fiveMinBefore) {
      const minutesLeft = Math.ceil((fiveMinBefore - now) / 60000);
      return `⏳ Disponible dans ${minutesLeft} min`;
    }

    // 🔴 live
    if (now >= eventTime) {
      return "🔴 Événement en cours";
    }

    // ✅ ok
    return "✅ Vous pouvez rejoindre l'événement";
  }

  openEventDetails(event: VirtualEvent) {
    this.selectedEvent = event;
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
    this.selectedEvent = null;
  }

  registerToEvent(event: VirtualEvent) {
    this.virtualEventService.register(event.id!, this.userId).subscribe({
      next: () => {
        alert("✅ Inscription réussie");
        event.currentParticipants = (event.currentParticipants || 0) + 1;
        this.loadJoinAccess();
      }
    });
  }

  payForEvent(event: VirtualEvent) {
    this.virtualEventService.pay(event.id!, this.userId).subscribe({
      next: () => {
        alert("💰 Paiement réussi");
        this.loadJoinAccess();
      }
    });
  }

  joinMeeting(event: VirtualEvent) {

    if (!this.canUserJoin(event)) {
      alert("❌ Accès refusé");
      return;
    }

    this.selectAvatar();

    if (event.type === 'ROOM') {
      localStorage.setItem("roomId", event.roomId!);
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
    localStorage.setItem("avatar", JSON.stringify(avatar));
  }

  formatDate(dateStr: string): string {
    return this.datePipe.transform(dateStr, 'EEEE dd MMMM yyyy à HH:mm') || '';
  }
}