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

  selectedType: 'VIRTUAL' | 'ROOM' | null = null;

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

      isRecording: [true],

      type: ['VIRTUAL'],
      roomId: ['']
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
      title: ev.title,
      scheduledAt: format(ev.start!, "yyyy-MM-dd'T'HH:mm"),
      type: ev.extendedProps['type'] || 'VIRTUAL',
      roomId: ev.extendedProps['roomId'] || ''
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

    this.eventForm.reset({
      isRecording: true,
      type: 'VIRTUAL',
      roomId: ''
    });
  }

  onSubmit() {
    if (this.eventForm.valid) {
      this.isEditMode ? this.onUpdate() : this.onCreate();
    }
  }

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
      isRecording: formValue.isRecording,
      type: formValue.type,
      roomId: formValue.roomId
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
          alert('Event created successfully');
        }
      });
  }

  onUpdate() {

    const formValue = this.eventForm.value;

    const updatedEvent: any = {
      title: formValue.title,
      description: formValue.description,
      scheduledAt: formValue.scheduledAt,
      endAt: formValue.endAt,
      type: formValue.type,
      roomId: formValue.roomId
    };

    this.http.put(`http://localhost:8081/api/virtual-events/${this.selectedEventId}`, updatedEvent)
      .subscribe(() => {
        this.loadAllEvents();
        this.closeModal();
        alert('Event updated successfully');
      });
  }

  confirmDelete() {
    const confirmed = confirm("Are you sure you want to delete this event?");
    if (confirmed) {
      this.onDelete();
    }
  }

  onDelete() {

    if (!this.selectedEventId) return;

    this.http.delete(`http://localhost:8081/api/virtual-events/${this.selectedEventId}`)
      .subscribe(() => {
        const ev = this.calendarComponent.getApi().getEventById(this.selectedEventId!);
        ev?.remove();
        this.closeModal();
        alert('Event deleted successfully');
      });
  }
}