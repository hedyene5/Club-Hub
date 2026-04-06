import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { VirtualEventService } from '../../services/virtual-event.service';
import { VirtualEvent } from '../../models/virtual-event';
import { Router } from '@angular/router';

@Component({
  selector: 'app-events',
  standalone: true,
  imports: [CommonModule],
  providers: [DatePipe],
  templateUrl: './events.component.html'
})
export class EventsComponent implements OnInit {

  events: VirtualEvent[] = [];
  selectedEvent: VirtualEvent | null = null;
  isModalOpen = false;

  constructor(
    private virtualEventService: VirtualEventService,
    private datePipe: DatePipe,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadEvents();
  }

  loadEvents() {
    this.virtualEventService.getAllEvents().subscribe({
      next: (data) => {
        this.events = data;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des événements', err);
      }
    });
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
    if (event.currentParticipants! >= event.maxParticipants!) {
      alert("Désolé, cet événement a atteint sa capacité maximale.");
      return;
    }
    alert(`✅ Inscription confirmée pour : ${event.title}`);
    this.closeModal();
  }

  payForEvent(event: VirtualEvent) {
    if (!event.price || event.price <= 0) {
      alert("Cet événement est gratuit.");
      return;
    }
    alert(`💰 Paiement pour "${event.title}" - ${event.price} TND`);
    this.closeModal();
  }

  // 🔥 NOUVELLE FONCTION
  joinMeeting(event: VirtualEvent) {

    if (!event.id) {
      alert("Lien invalide");
      return;
    }

    const now = new Date();
    const eventDate = new Date(event.scheduledAt);

    if (now < eventDate) {
      const confirmJoin = confirm("⏳ L'événement n'a pas encore commencé. Continuer ?");
      if (!confirmJoin) return;
    }

    if (event.status === 'COMPLETED') {
      alert("Cet événement est terminé.");
      return;
    }

    if (event.currentParticipants! >= event.maxParticipants!) {
      alert("Événement complet.");
      return;
    }

    // 🔥 REDIRECTION PAGE CUSTOM
    this.router.navigate(['/meeting', event.id]);

    this.closeModal();
  }

  formatDate(dateStr: string): string {
    return this.datePipe.transform(dateStr, 'EEEE dd MMMM yyyy à HH:mm') || '';
  }

  getStatusColor(status?: string): string {
    switch (status?.toLowerCase()) {
      case 'upcoming': return 'bg-green-100 text-green-700';
      case 'ongoing': return 'bg-orange-100 text-orange-700';
      case 'completed': return 'bg-gray-100 text-gray-700';
      default: return 'bg-blue-100 text-blue-700';
    }
  }
}