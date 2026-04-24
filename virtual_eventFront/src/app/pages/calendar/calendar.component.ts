import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { FullCalendarComponent, FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, DateSelectArg, EventInput, EventClickArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { HttpClient } from '@angular/common/http';
import { format } from 'date-fns';
import { VirtualEvent } from '../../models/virtual-event';

interface ChatMessage {
  role: 'user' | 'bot';
  text: string;
  parsedEvent?: any;
}

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, FullCalendarModule],
  templateUrl: './calendar.component.html'
})
export class CalendarComponent implements OnInit {

  @ViewChild('calendar') calendarComponent!: FullCalendarComponent;

  isModalOpen = false;
  isEditMode = false;
  selectedEventId: string | null = null;
  selectedType: 'VIRTUAL' | 'ROOM' | null = null;

  // ── Chatbot ──────────────────────────────────────────
  isChatOpen = false;
  chatInput = '';
  chatLoading = false;
  chatMessages: ChatMessage[] = [
    {
      role: 'bot',
      text: 'Bonjour ! Je peux t\'aider de deux façons :\n• Décris un événement → je remplis le formulaire\n• Écris "propose-moi des formations" → je génère des idées'
    }
  ];
  // ─────────────────────────────────────────────────────

  eventForm: FormGroup;

  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    initialView: 'dayGridMonth',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay'
    },
    selectable: true,
    selectMirror: true,
    dayMaxEvents: true,
    editable: true,
    select: this.handleDateSelect.bind(this),
    eventClick: this.handleEventClick.bind(this),
    events: []
  };

  constructor(private fb: FormBuilder, private http: HttpClient) {
    this.eventForm = this.fb.group({
      title:           ['', Validators.required],
      description:     [''],
      scheduledAt:     ['', Validators.required],
      endAt:           [''],
      price:           [0],
      isPaid:          [false],
      maxParticipants: [0],
      imageUrl:        [''],
      isRecording:     [true],
      type:            ['VIRTUAL'],
      roomId:          ['']
    });
  }

  ngOnInit() { this.loadAllEvents(); }

  // ── Chatbot methods ───────────────────────────────────

  toggleChat() {
    this.isChatOpen = !this.isChatOpen;
  }

  sendChatMessage() {
    const text = this.chatInput.trim();
    if (!text || this.chatLoading) return;

    this.chatMessages.push({ role: 'user', text });
    this.chatInput = '';
    this.chatLoading = true;

    const systemPrompt = `Tu es un assistant expert en formation professionnelle.

Tu as DEUX modes selon le message de l'utilisateur:

MODE 1 - EXTRACTION: Si l'utilisateur décrit un événement précis, extrais les infos et retourne UNIQUEMENT ce JSON:
{
  "mode": "extract",
  "title": "string",
  "description": "string détaillée ou null",
  "category": "string (Tech/Business/Design/Marketing/RH/Finance) ou null",
  "scheduledAt": "ISO 8601 ex: 2026-06-15T14:00:00",
  "endAt": "ISO 8601 ou null (ajoute 2h par défaut si durée non précisée)",
  "isRecording": true,
  "price": number ou null,
  "isPaid": true ou false,
  "maxParticipants": number ou null,
  "imageUrl": "une URL Unsplash pertinente ex: https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800",
  "status": "UPCOMING",
  "type": "VIRTUAL",
  "roomId": null
}

MODE 2 - SUGGESTION: Si l'utilisateur demande des idées ou propositions, retourne UNIQUEMENT ce JSON:
{
  "mode": "suggest",
  "suggestions": [
    {
      "title": "string",
      "description": "string courte",
      "category": "string",
      "scheduledAt": "ISO 8601 dans les 30 prochains jours",
      "endAt": "ISO 8601",
      "price": number,
      "isPaid": true/false,
      "maxParticipants": number,
      "imageUrl": "URL Unsplash pertinente",
      "isRecording": true,
      "status": "UPCOMING",
      "type": "VIRTUAL",
      "roomId": null
    }
  ]
}
Génère 3 suggestions variées et pertinentes.

RÈGLE ABSOLUE: Retourne UNIQUEMENT le JSON, rien d'autre, pas de markdown.`;

    this.http.post(
      'http://localhost:8082/api/ai/parse',
      `${systemPrompt}\n\nMessage: ${text}`,
      { responseType: 'text' }
    ).subscribe({
      next: (response: string) => {
        try {
          const cleaned = response.replace(/```json|```/g, '').trim();
          const parsed = JSON.parse(cleaned);

          if (parsed.mode === 'suggest') {
            this.chatMessages.push({
              role: 'bot',
              text: `Voici ${parsed.suggestions.length} formations que je te propose 👇`
            });
            parsed.suggestions.forEach((s: any) => {
              this.chatMessages.push({
                role: 'bot',
                text: `📚 ${s.title}\n${s.description}\n💰 ${s.isPaid ? s.price + ' TND' : 'Gratuit'} · 👥 Max ${s.maxParticipants} participants`,
                parsedEvent: s
              });
            });
          } else {
            this.chatMessages.push({
              role: 'bot',
              text: `✅ J'ai extrait toutes les informations ! Clique sur le bouton pour remplir le formulaire.`,
              parsedEvent: parsed
            });
          }
        } catch {
          this.chatMessages.push({
            role: 'bot',
            text: 'Je n\'ai pas compris. Essaie:\n• "Propose-moi des formations"\n• "Conférence AI le 15 juin à 14h, payante 80 TND"'
          });
        }
        this.chatLoading = false;
      },
      error: () => {
        this.chatMessages.push({ role: 'bot', text: 'Erreur de connexion au serveur AI.' });
        this.chatLoading = false;
      }
    });
  }

  injectIntoForm(parsed: any) {
    const toLocalFormat = (iso: string | null) => {
      if (!iso) return '';
      try { return format(new Date(iso), "yyyy-MM-dd'T'HH:mm"); }
      catch { return ''; }
    };

    this.eventForm.patchValue({
      title:           parsed.title           || '',
      description:     parsed.description     || '',
      scheduledAt:     toLocalFormat(parsed.scheduledAt),
      endAt:           toLocalFormat(parsed.endAt),
      price:           parsed.price           ?? 0,
      isPaid:          parsed.isPaid          ?? false,
      maxParticipants: parsed.maxParticipants ?? 0,
      imageUrl:        parsed.imageUrl        || '',
      isRecording:     parsed.isRecording     ?? true,
      type:            parsed.type            || 'VIRTUAL',
      roomId:          parsed.roomId          || ''
    });

    if (!this.isModalOpen) {
      this.isEditMode = false;
      this.selectedEventId = null;
      this.isModalOpen = true;
    }

    this.chatMessages.push({
      role: 'bot',
      text: '✓ Formulaire rempli avec tous les champs ! Vérifie et soumets.'
    });
  }

  onChatKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendChatMessage();
    }
  }

  // ─────────────────────────────────────────────────────

  loadAllEvents() {
    this.http.get<VirtualEvent[]>('http://localhost:8082/api/virtual-events').subscribe({
      next: (events) => {
        const fcEvents: EventInput[] = events.map(ev => ({
          id: ev.id?.toString(),
          title: ev.title,
          start: ev.scheduledAt,
          extendedProps: {
            meetingLink: ev.meetingLink,
            type: (ev as any).type,
            roomId: (ev as any).roomId
          }
        }));
        this.calendarOptions.events = fcEvents;
      }
    });
  }

  handleDateSelect(selectInfo: DateSelectArg) {
    const formattedDate = format(selectInfo.start, "yyyy-MM-dd'T'HH:mm");
    this.eventForm.patchValue({ scheduledAt: formattedDate });
    this.isEditMode = false;
    this.selectedEventId = null;
    this.openCreateModal();
  }

  handleEventClick(clickInfo: EventClickArg) {
    const ev = clickInfo.event;
    this.selectedEventId = ev.id;
    this.isEditMode = true;
    this.eventForm.patchValue({
      title:       ev.title,
      scheduledAt: format(ev.start!, "yyyy-MM-dd'T'HH:mm"),
      type:        ev.extendedProps['type']   || 'VIRTUAL',
      roomId:      ev.extendedProps['roomId'] || ''
    });
    this.isModalOpen = true;
  }

  openCreateModal() {
    this.isModalOpen = true;
    this.selectedType = 'VIRTUAL';
  }

  closeModal() {
    this.isModalOpen = false;
    this.isEditMode = false;
    this.selectedEventId = null;
    this.selectedType = null;
    this.eventForm.reset({ isRecording: true, type: 'VIRTUAL', roomId: '' });
  }

  onSubmit() {
    if (this.eventForm.valid) {
      this.isEditMode ? this.onUpdate() : this.onCreate();
    }
  }

  onCreate() {
    const formValue = this.eventForm.value;
    const newEvent: any = {
      title:           formValue.title,
      description:     formValue.description,
      scheduledAt:     formValue.scheduledAt,
      endAt:           formValue.endAt,
      price:           formValue.price,
      isPaid:          formValue.isPaid,
      maxParticipants: formValue.maxParticipants,
      imageUrl:        formValue.imageUrl,
      isRecording:     formValue.isRecording,
      type:            formValue.type,
      roomId:          formValue.roomId
    };
    this.http.post<VirtualEvent>('http://localhost:8082/api/virtual-events', newEvent).subscribe({
      next: (createdEvent) => {
        this.calendarComponent.getApi().addEvent({
          id:    createdEvent.id,
          title: createdEvent.title,
          start: createdEvent.scheduledAt
        });
        this.closeModal();
        alert('Event created successfully');
      }
    });
  }

  onUpdate() {
    const formValue = this.eventForm.value;
    const updatedEvent: any = {
      title:       formValue.title,
      description: formValue.description,
      scheduledAt: formValue.scheduledAt,
      endAt:       formValue.endAt,
      type:        formValue.type,
      roomId:      formValue.roomId
    };
    this.http.put(`http://localhost:8082/api/virtual-events/${this.selectedEventId}`, updatedEvent)
      .subscribe(() => {
        this.loadAllEvents();
        this.closeModal();
        alert('Event updated successfully');
      });
  }

  confirmDelete() {
    if (confirm('Are you sure you want to delete this event?')) this.onDelete();
  }

  onDelete() {
    if (!this.selectedEventId) return;
    this.http.delete(`http://localhost:8082/api/virtual-events/${this.selectedEventId}`)
      .subscribe(() => {
        const ev = this.calendarComponent.getApi().getEventById(this.selectedEventId!);
        ev?.remove();
        this.closeModal();
        alert('Event deleted successfully');
      });
  }
}