import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FullCalendarComponent, FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, DateSelectArg, EventInput, EventClickArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { HttpClient } from '@angular/common/http';
import { format } from 'date-fns';

import { VirtualEvent } from '../../models/virtual-event';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FullCalendarModule
  ],
  templateUrl: './calendar.component.html'
})
export class CalendarComponent implements OnInit {

  @ViewChild('calendar') calendarComponent!: FullCalendarComponent;

  isModalOpen = false;
  isEditMode = false;
  selectedEventId: string | null = null;
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
    eventTimeFormat: {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    },
    select: this.handleDateSelect.bind(this),
    eventClick: this.handleEventClick.bind(this),
    events: [] as EventInput[]
  };

  constructor(
    private fb: FormBuilder,
    private http: HttpClient
  ) {
  this.eventForm = this.fb.group({
  title: ['', Validators.required],
  description: [''],
  scheduledAt: ['', Validators.required],
  endAt: [''],

  price: [0],
  isPaid: [false],

  maxParticipants: [0],
  imageUrl: [''],

  isRecording: [true]
});
  }

  ngOnInit() {
    this.loadAllEvents();
  }

  loadAllEvents() {
    this.http.get<VirtualEvent[]>('http://localhost:8081/api/virtual-events')
      .subscribe({
        next: (events) => {
          const fcEvents: EventInput[] = events.map(ev => ({
            id: ev.id?.toString(),
            title: ev.title,
            start: ev.scheduledAt,
            extendedProps: {
              meetingLink: ev.meetingLink,
              isRecording: ev.isRecording
            }
          }));
          this.calendarOptions.events = fcEvents;
        },
        error: (err) => console.error('Erreur chargement événements', err)
      });
  }

  handleDateSelect(selectInfo: DateSelectArg) {
    const formattedDate = format(selectInfo.start, "yyyy-MM-dd'T'HH:mm");
    this.eventForm.patchValue({ scheduledAt: formattedDate });
    this.isEditMode = false;
    this.selectedEventId = null;
    this.openCreateModal();
  }

  // Clic sur un event existant → ouvre le modal en mode édition
  handleEventClick(clickInfo: EventClickArg) {
    const ev = clickInfo.event;
    this.selectedEventId = ev.id;
    this.isEditMode = true;

    this.eventForm.patchValue({
      title: ev.title,
      scheduledAt: format(ev.start!, "yyyy-MM-dd'T'HH:mm"),
      meetingLink: ev.extendedProps['meetingLink'] || '',
      isRecording: ev.extendedProps['isRecording'] ?? true
    });

    this.isModalOpen = true;
  }

  openCreateModal() {
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
    this.isEditMode = false;
    this.selectedEventId = null;
    this.eventForm.reset({ isRecording: true });
  }

  onSubmit() {
    if (this.eventForm.valid) {
      if (this.isEditMode && this.selectedEventId) {
        this.onUpdate();
      } else {
        this.onCreate();
      }
    }
  }

  // Création d'un nouvel événement
  onCreate() {
  const formValue = this.eventForm.value;

  const newEvent: any = {
    title: formValue.title,
    description: formValue.description,
    scheduledAt: formValue.scheduledAt,
    endAt: formValue.endAt,

    price: formValue.price,
    isPaid: formValue.isPaid,

    maxParticipants: formValue.maxParticipants,
    imageUrl: formValue.imageUrl,

    isRecording: formValue.isRecording
  };

  this.http.post<VirtualEvent>('http://localhost:8081/api/virtual-events', newEvent)
    .subscribe({
      next: (createdEvent) => {
        this.calendarComponent.getApi().addEvent({
          id: createdEvent.id,
          title: createdEvent.title,
          start: createdEvent.scheduledAt
        });

        this.closeModal();
        alert('✅ Event créé avec succès !');
      },
      error: (err) => {
        console.error(err);
        alert('❌ Erreur');
      }
    });
}
  // Mise à jour d'un événement existant
  onUpdate() {
  const formValue = this.eventForm.value;

  const updatedEvent: any = {
    title: formValue.title,
    description: formValue.description,
    scheduledAt: formValue.scheduledAt,
    endAt: formValue.endAt,

    price: formValue.price,
    isPaid: formValue.isPaid,

    maxParticipants: formValue.maxParticipants,
    imageUrl: formValue.imageUrl,

    isRecording: formValue.isRecording
  };

  this.http.put(`http://localhost:8081/api/virtual-events/${this.selectedEventId}`, updatedEvent)
    .subscribe(() => {
      this.loadAllEvents();
      this.closeModal();
      alert('✅ Modifié');
    });
}
  // Suppression d'un événement
  onDelete() {
    if (!this.selectedEventId) return;

    if (!confirm('🗑️ Voulez-vous vraiment supprimer cet événement ?')) return;

    this.http.delete(`http://localhost:8081/api/virtual-events/${this.selectedEventId}`)
      .subscribe({
        next: () => {
          const calEvent = this.calendarComponent.getApi().getEventById(this.selectedEventId!);
          if (calEvent) calEvent.remove();
          this.closeModal();
          alert('✅ Formation supprimée avec succès !');
        },
        error: (err) => {
          console.error(err);
          alert('❌ Erreur lors de la suppression');
        }
      });
  }
}