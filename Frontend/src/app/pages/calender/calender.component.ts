import { Component, ViewChild, AfterViewInit, HostListener, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

import { FullCalendarComponent, FullCalendarModule } from '@fullcalendar/angular';
import { EventInput, CalendarOptions, DateSelectArg, EventClickArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { ModalComponent } from '../../shared/components/ui/modal/modal.component';
import { EventService, BackendEvent, EventStaffMember } from '../../shared/services/event.service';
import { VirtualEventService } from '../../shared/services/virtual-event.service';
import { VirtualEvent } from '../../models/virtual-event.model';
import { STAFF_ROLE_HINTS } from '../../shared/constants/staff-role-hints';
import { EVENT_FORMAT_OPTIONS, eventFormatShort } from '../../shared/constants/event-formats';
import { LocationService } from '../../shared/services/location.service';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';
import { CommitteeResponsableService } from '../../shared/services/committee-responsable.service';
import { forkJoin, of, Subject, Subscription } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import {
  EventRecommendationsWidgetComponent,
  StaffRecommendation,
} from '../../shared/components/event-recommendations-widget/event-recommendations-widget.component';
import { SuggestedTiming, EventRecommendationService } from '../../shared/services/event-recommendation.service';
import { AiFeedbackSummaryModalComponent } from '../../shared/components/ai-feedback-summary-modal/ai-feedback-summary-modal.component';
import { FeedbackSentimentModalComponent } from '../../shared/components/feedback-sentiment-modal/feedback-sentiment-modal.component';
import * as L from 'leaflet';
import { apiUrl } from '../../../environments/environment';
import { format } from 'date-fns';

// Fix Leaflet icon issue
const iconDefault = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = iconDefault;

/** Chat message interface – used by the chatbot panel */
interface ChatMessage {
  role: 'user' | 'bot';
  text: string;
  parsedEvent?: any;
}

@Component({
  selector: 'app-calender',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    FullCalendarModule,
    ModalComponent,
    EventRecommendationsWidgetComponent,
    AiFeedbackSummaryModalComponent,
    FeedbackSentimentModalComponent,
    RouterModule
  ],
  templateUrl: './calender.component.html',
  styles: [`
    .map-container { height: 240px; width: 100%; border-radius: 10px; position: relative; z-index: 1; }
    :host ::ng-deep .modal-backdrop { z-index: 1200 !important; }
    :host ::ng-deep .modal-panel { z-index: 1201 !important; }
    .modal-scroll { overflow-y: auto; max-height: calc(100dvh - 130px); padding-right: 2px; }
    :host ::ng-deep .fc-event { border: none !important; cursor: grab !important; }
    :host ::ng-deep .fc-daygrid-event { margin-bottom: 2px !important; border-radius: 5px !important; }
  `]
})
export class CalenderComponent implements AfterViewInit, OnInit, OnDestroy {
  @ViewChild('calendar') calendarComponent!: FullCalendarComponent;

  selectedEvent: BackendEvent | null = null;
  /** Set when the modal is open on an existing virtual event (edit mode). */
  selectedVirtualEvent: VirtualEvent | null = null;
  /**
   * Which sub-form to show inside the "create event" modal.
   *   - 'physical' → original flow (location, staff, capacity, AI reco…)
   *   - 'virtual'  → virtual-event flow (meeting type, price, recording…)
   * Defaults to 'physical' for backwards-compatible behaviour.
   */
  createEventType: 'physical' | 'virtual' = 'physical';
  isOpen = false;
  submitted = false;
  errorMessage = '';
  successMessage = '';
  private calendarReady = false;
  private formMap: L.Map | null = null;
  private formMarker: L.Marker | null = null;

  // Search
  searchQuery = '';
  searchResults: any[] = [];
  showSearchResults = false;
  isSearching = false;
  private searchInput$ = new Subject<string>();
  private searchSub: Subscription | null = null;

  // Form fields
  eventTitle = '';
  eventDescription = '';
  eventStartDate = '';
  eventEndDate = '';
  eventLocationName = '';
  eventLocationAddress = '';
  eventLat: number | null = 33.8869;
  eventLng: number | null = 9.5375;
  eventCapacity: number | null = null;
  eventStatus = 'published';
  staffList: EventStaffMember[] = [];
  newStaffName = '';
  newStaffRoleText = 'formateur';
  newStaffBudget: number | null = null;
  staffAddError = '';
  memberInfoForPublic = '';
  private eventCache: BackendEvent[] = [];
  private virtualEventCache: VirtualEvent[] = [];

  eventFormat = '';
  eventFormatCustom = '';
  readonly eventFormatOptions = EVENT_FORMAT_OPTIONS;

  // ── Virtual-event-only form fields ──
  virtualType: 'VIRTUAL' | 'ROOM' = 'VIRTUAL';
  virtualRoomId = '';
  virtualMeetingLink = '';
  virtualPrice: number | null = null;
  virtualIsPaid = false;
  virtualIsRecording = false;
  virtualImageUrl = '';
  virtualCategory = '';

  readonly staffRoleHints = STAFF_ROLE_HINTS;

  // ── Chatbot properties ──
  isChatOpen = false;
  chatInput = '';
  chatLoading = false;
  chatMessages: ChatMessage[] = [
    {
      role: 'bot',
      text: 'Bonjour ! Je peux t\'aider de deux façons :\n• Décris un événement → je remplis le formulaire\n• Écris "propose-moi des formations" → je génère des idées'
    }
  ];
  // Gateway-friendly API base URLs
  private readonly virtualEventsApi = apiUrl('/api/virtual-events');
  private readonly aiParseApi = apiUrl('/api/ai/parse');

  statusConfig: Record<string, { color: string; label: string }> = {
    published: { color: '#6366f1', label: 'Published' },
    draft: { color: '#f59e0b', label: 'Draft' },
    cancelled: { color: '#ef4444', label: 'Cancelled' },
    completed: { color: '#10b981', label: 'Completed' },
  };

  getColorFromStatus(s: string): string {
    return this.statusConfig[s]?.color ?? '#6366f1';
  }

  get titleError() { return this.submitted && !this.eventTitle.trim() ? 'Title required' : ''; }
  get startDateError() { return this.submitted && !this.eventStartDate ? 'Start date required' : ''; }
  get endDateError() {
    if (!this.submitted) return '';
    if (this.createEventType === 'virtual') {
      if (!this.eventEndDate) return '';
      if (!this.eventStartDate) return '';
      const s = new Date(this.eventStartDate).getTime();
      const e = new Date(this.eventEndDate).getTime();
      if (Number.isNaN(s) || Number.isNaN(e)) return '';
      if (e <= s) return 'End date and time must be after the start';
      return '';
    }
    if (!this.eventEndDate) return 'End date required';
    if (!this.eventStartDate) return '';
    const s = new Date(this.eventStartDate).getTime();
    const e = new Date(this.eventEndDate).getTime();
    if (Number.isNaN(s) || Number.isNaN(e)) return '';
    if (e <= s) return 'End date and time must be after the start';
    return '';
  }
  get formateurError() {
    if (!this.submitted) return '';
    return this.staffList.length > 0 ? '' : 'Add at least one staff member (any role).';
  }
  get duplicateDayError() {
    if (!this.submitted || !this.eventStartDate) return '';
    if (this.hasDuplicateStartDay(this.eventStartDate + ':00', this.selectedEvent?.id)) {
      return 'Another active event already starts on this calendar day';
    }
    return '';
  }
  get capacityError() { return this.submitted && this.eventCapacity !== null && this.eventCapacity <= 0 ? 'Must be > 0' : ''; }
  get eventFormatError() {
    if (!this.submitted) return '';
    if (this.eventFormat === 'other' && !this.eventFormatCustom.trim()) {
      return "Please specify the format when 'Other' is selected";
    }
    return '';
  }
  get isFormValid() {
    if (this.createEventType === 'virtual') {
      return (
          !this.titleError &&
          !this.startDateError &&
          !this.endDateError
      );
    }
    return (
        !this.titleError &&
        !this.startDateError &&
        !this.endDateError &&
        !this.capacityError &&
        !this.eventFormatError &&
        !this.formateurError &&
        !this.duplicateDayError
    );
  }

  private normalizeRole(r: string): string {
    return (r || '').trim().toLowerCase();
  }

  private startOfToday(): Date {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }

  private localDayKey(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  hasDuplicateStartDay(startIso: string, excludeId?: string): boolean {
    const key = this.localDayKey(startIso);
    if (!key) return false;
    return this.eventCache.some((ev) => {
      if (!ev.startDate || (excludeId && ev.id === excludeId)) return false;
      const st = (ev.status || '').toLowerCase();
      if (st === 'cancelled') return false;
      return this.localDayKey(ev.startDate) === key;
    });
  }

  private isStrictlyBeforeToday(iso: string): boolean {
    const d = this.parseInputAsLocalDate(iso);
    if (Number.isNaN(d.getTime())) return false;
    const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    return dayStart < this.startOfToday();
  }

  private parseInputAsLocalDate(str: string): Date {
    if (!str) return new Date(NaN);
    if (str.includes('T')) {
      const [datePart, timePart] = str.split('T');
      const [y, mo, d] = datePart.split('-').map(Number);
      const [hh, mm] = (timePart || '00:00').split(':').map(Number);
      return new Date(y, mo - 1, d, hh || 0, mm || 0, 0, 0);
    }
    const [y, mo, d] = str.substring(0, 10).split('-').map(Number);
    return new Date(y, mo - 1, d, 0, 0, 0, 0);
  }

  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    initialView: 'dayGridMonth',
    headerToolbar: { left: 'prev,next addEventButton', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay' },
    selectable: true,
    editable: true,
    dayMaxEvents: 3,
    events: [],
    selectAllow: (info) => !this.isStrictlyBeforeToday(info.startStr),
    eventAllow: (dropInfo) => !this.isStrictlyBeforeToday(dropInfo.startStr),
    select: (info) => this.handleDateSelect(info),
    eventClick: (info) => this.handleEventClick(info),
    eventDrop: (info) => this.handleEventDrop(info),
    eventResize: (info) => this.handleEventResize(info),
    customButtons: {
      addEventButton: {
        text: '＋ Add Event',
        click: () => {
          if (!this.canManageEvents()) {
            alert("Accès refusé");
            return;
          }
          this.resetModalFields();
          this.createEventType = 'physical';
          this.applyDefaultEventWindow();
          this.openModal();
        },
      },
    },
    eventContent: (arg) => this.renderEventContent(arg),
  };

  drafting = false;
  draftError = '';

  constructor(
      private eventService: EventService,
      private locationService: LocationService,
      private recoService: EventRecommendationService,
      private virtualEventService: VirtualEventService,
      private authService: AuthService,
      private committeeResponsableService: CommitteeResponsableService,
      private router: Router,
      private http: HttpClient
  ) {}

  canAccess(): boolean {
    if (this.authService.getCurrentRole() === 'PRESIDENT') return true;
    const isResponsable = this.committeeResponsableService.isResponsable();
    const groupName = (this.committeeResponsableService.getMySubGroupName() || '').toLowerCase();
    return isResponsable && (groupName.includes('event') || groupName.includes('evenement'));
  }

  canManageEvents(): boolean {
    return this.canAccess();
  }

  private readonly virtualEventColor = '#8b5cf6';
  showVirtualEvents = true;

  ngOnInit() {
    this.searchSub = this.searchInput$.pipe(
        debounceTime(350),
        distinctUntilChanged(),
        switchMap(q => {
          if (q.length <= 2) {
            this.searchResults = [];
            this.showSearchResults = false;
            this.isSearching = false;
            return of(null);
          }
          return this.locationService.geocodeAddress(q).pipe(
              catchError(err => {
                console.error('[Nominatim] geocode failed for "%s":', q, err);
                return of([]);
              })
          );
        })
    ).subscribe(results => {
      this.isSearching = false;
      if (results === null) return;
      this.searchResults = Array.isArray(results) ? results : [];
      this.showSearchResults = true;
      console.debug('[Nominatim] %d results for "%s"', this.searchResults.length, this.searchQuery);
    });
  }

  ngOnDestroy() {
    this.searchSub?.unsubscribe();
    this.searchInput$.complete();
  }

  ngAfterViewInit() {
    this.committeeResponsableService.responsableStatus$.subscribe(status => {
      if (status === null) return;

      if (!this.canAccess()) {
        console.warn("Accès refusé au calendrier");
        this.router.navigate(['/dashboard']);
        return;
      }

      if (!this.calendarReady) {
        this.calendarReady = true;
        this.loadEvents();
      }
    });
  }

  @HostListener('document:click', ['$event'])
  onDocClick(e: MouseEvent) {
    if (!(e.target as HTMLElement).closest('.search-wrapper')) {
      this.showSearchResults = false;
    }
  }

  loadEvents(): void {
    forkJoin({
      physical: this.eventService.getEvents().pipe(catchError(() => of<BackendEvent[]>([]))),
      virtual:  this.showVirtualEvents
          ? this.virtualEventService.getAllEvents()
          : of<VirtualEvent[]>([]),
    }).subscribe({
      next: ({ physical, virtual }) => {
        this.eventCache = physical || [];
        this.virtualEventCache = virtual || [];

        const physicalCal: EventInput[] = (physical || []).map(ev => ({
          id: ev.id,
          title: ev.title,
          start: ev.startDate,
          end: ev.endDate,
          backgroundColor: this.getColorFromStatus(ev.status || 'published'),
          borderColor: 'transparent',
          textColor: '#fff',
          extendedProps: { backendEvent: ev, eventKind: 'physical' }
        }));

        const virtualCal: EventInput[] = (virtual || [])
            .filter(ev => !!ev.scheduledAt)
            .map(ev => ({
              id: `v-${ev.id}`,
              title: ev.title,
              start: ev.scheduledAt,
              end: ev.endAt,
              backgroundColor: this.virtualEventColor,
              borderColor: 'transparent',
              textColor: '#fff',
              editable: false,
              durationEditable: false,
              extendedProps: { virtualEvent: ev, eventKind: 'virtual' }
            }));

        this.updateCalendarEvents([...physicalCal, ...virtualCal]);
      },
      error: (err) => { this.errorMessage = 'Failed to load events. Please try again.'; console.error('Failed to load events:', err); }
    });
  }

  private updateCalendarEvents(events: EventInput[]) {
    if (!this.calendarReady) return;
    const api = this.calendarComponent.getApi();
    api.removeAllEvents();
    api.addEventSource(events);
  }

  private toIsoDateTime(value?: string | null): string {
    if (!value) return '';
    if (!value.includes('T')) return `${value}T00:00:00`;
    const noTz = value.replace(/(Z|[+-]\d{2}:\d{2})$/, '');
    return noTz.length >= 19 ? noTz.substring(0, 19) : noTz;
  }

  handleEventDrop(dropInfo: any) {
    const ev = dropInfo.event.extendedProps['backendEvent'] as BackendEvent;
    if (!ev?.id) return;

    const startDate = this.toIsoDateTime(dropInfo.event.startStr);
    const endDate = this.toIsoDateTime(dropInfo.event.endStr || ev.endDate);

    if (this.isStrictlyBeforeToday(dropInfo.event.startStr)) {
      dropInfo.revert();
      this.errorMessage = 'Cannot move an event to a past date.';
      return;
    }
    if (new Date(endDate).getTime() <= new Date(startDate).getTime()) {
      dropInfo.revert();
      this.errorMessage = 'End must be after start.';
      return;
    }
    if (this.hasDuplicateStartDay(startDate, ev.id)) {
      dropInfo.revert();
      this.errorMessage = 'Another event already starts on this day.';
      return;
    }

    this.eventService.updateEvent(ev.id, { ...ev, startDate, endDate }).subscribe({
      next: () => {
        this.errorMessage = '';
        this.loadEvents();
      },
      error: () => dropInfo.revert(),
    });
  }

  handleEventResize(info: any) {
    const ev = info.event.extendedProps['backendEvent'] as BackendEvent;
    if (!ev?.id) return;

    const startDate = this.toIsoDateTime(info.event.startStr);
    const endDate = this.toIsoDateTime(info.event.endStr);

    if (this.isStrictlyBeforeToday(info.event.startStr)) {
      info.revert();
      this.errorMessage = 'Cannot resize into a past start date.';
      return;
    }
    if (new Date(endDate).getTime() <= new Date(startDate).getTime()) {
      info.revert();
      this.errorMessage = 'End must be after start.';
      return;
    }

    this.eventService.updateEvent(ev.id, { ...ev, startDate, endDate }).subscribe({
      next: () => {
        this.errorMessage = '';
        this.loadEvents();
      },
      error: () => info.revert(),
    });
  }

  handleDateSelect(info: DateSelectArg) {
    if (this.isStrictlyBeforeToday(info.startStr)) {
      this.errorMessage = 'Cannot create an event starting on a past date.';
      return;
    }
    this.resetModalFields();
    this.createEventType = 'physical';
    const toLocal = (str: string, fallbackTime: string) => (str.includes('T') ? str.substring(0, 16) : str + fallbackTime);
    this.eventStartDate = toLocal(info.startStr, 'T08:00');
    this.eventEndDate = toLocal(info.endStr || info.startStr, 'T10:00');
    this.openModal();
  }

  private loadVirtualEventIntoModal(ev: VirtualEvent): void {
    this.resetModalFields();
    this.createEventType = 'virtual';
    this.selectedEvent = null;
    this.selectedVirtualEvent = ev;

    this.eventTitle = ev.title || '';
    this.eventDescription = ev.description || '';
    this.eventStartDate = (ev.scheduledAt || '').substring(0, 16);
    this.eventEndDate   = (ev.endAt || '').substring(0, 16);
    this.eventCapacity  = ev.maxParticipants ?? null;

    this.virtualType       = ev.type || 'VIRTUAL';
    this.virtualRoomId     = ev.roomId || '';
    this.virtualMeetingLink = ev.meetingLink || '';
    this.virtualPrice      = ev.price ?? null;
    this.virtualIsPaid     = !!ev.isPaid;
    this.virtualIsRecording = !!ev.isRecording;
    this.virtualImageUrl   = ev.imageUrl || '';
    this.virtualCategory   = ev.category || '';

    this.openModal();
  }

  private getEventTimeOverlapMessage(kind: 'physical' | 'virtual'): string | null {
    const startStr = this.eventStartDate?.trim();
    if (!startStr) return null;
    const sNew = new Date(startStr + ':00').getTime();
    if (Number.isNaN(sNew)) return null;

    let eNew: number;
    if (this.eventEndDate?.trim()) {
      eNew = new Date(this.eventEndDate + ':00').getTime();
    } else if (kind === 'virtual') {
      eNew = sNew + 2 * 60 * 60 * 1000;
    } else {
      return null;
    }
    if (Number.isNaN(eNew) || eNew <= sNew) {
      return 'Invalid time range: end must be after start.';
    }

    const exPhys = this.selectedEvent?.id;
    const exVirt = this.selectedVirtualEvent?.id;
    const rangeOverlap = (a0: number, a1: number, b0: number, b1: number) => a0 < b1 && b0 < a1;

    for (const ev of this.eventCache) {
      if (exPhys && ev.id === exPhys) continue;
      if ((ev.status || '').toLowerCase() === 'cancelled') continue;
      if (!ev.startDate) continue;
      const a0 = new Date(this.normalizeDateTimeString(ev.startDate)).getTime();
      const a1 = new Date(this.normalizeDateTimeString(ev.endDate || ev.startDate)).getTime();
      if (Number.isNaN(a0) || Number.isNaN(a1) || a1 <= a0) continue;
      if (rangeOverlap(sNew, eNew, a0, a1)) return 'Another in-person event is already running in this time window.';
    }

    for (const ve of this.virtualEventCache) {
      if (exVirt && ve.id === exVirt) continue;
      const st = (ve.status || '').toUpperCase();
      if (st === 'CANCELLED' || st === 'FINISHED') continue;
      if (!ve.scheduledAt) continue;
      const a0 = new Date(this.normalizeDateTimeString(ve.scheduledAt)).getTime();
      const endSrc = ve.endAt || ve.scheduledAt;
      const a1 = new Date(this.normalizeDateTimeString(endSrc)).getTime();
      if (Number.isNaN(a0) || Number.isNaN(a1) || a1 <= a0) continue;
      if (rangeOverlap(sNew, eNew, a0, a1)) return 'A virtual event is already running in this time window.';
    }

    return null;
  }

  private normalizeDateTimeString(v: string): string {
    if (!v) return v;
    const t = v.includes('T') ? v : v.replace(' ', 'T');
    if (/[Z+-]\d{2}:\d{2}$|Z$/.test(t)) return t;
    if (t.length === 16) return t + ':00';
    if (t.length === 10) return t + 'T00:00:00';
    return t;
  }

  setCreateEventType(kind: 'physical' | 'virtual'): void {
    if (this.selectedEvent || this.selectedVirtualEvent) return;
    this.createEventType = kind;
    this.submitted = false;
    if (kind === 'virtual' && !this.eventStartDate?.trim()) {
      this.applyDefaultEventWindow();
    }
    if (kind === 'virtual' && this.formMap) {
      this.formMap.remove();
      this.formMap = null;
      this.formMarker = null;
    }
    if (kind === 'physical') {
      setTimeout(() => this.initFormMap(), 300);
    }
  }

  handleEventClick(info: EventClickArg) {
    const virtual = info.event.extendedProps['virtualEvent'] as VirtualEvent | undefined;
    if (virtual) {
      this.loadVirtualEventIntoModal(virtual);
      return;
    }

    const ev = info.event.extendedProps['backendEvent'] as BackendEvent;
    if (!ev) return;

    this.createEventType = 'physical';
    this.selectedVirtualEvent = null;
    this.selectedEvent = ev;
    this.eventTitle = ev.title || '';
    this.eventDescription = ev.description || '';
    this.eventStartDate = ev.startDate?.substring(0, 16) || '';
    this.eventEndDate = ev.endDate?.substring(0, 16) || '';
    this.eventLocationName = ev.location?.name || '';
    this.eventLocationAddress = ev.location?.address || '';
    this.eventLat = ev.location?.coordinates?.lat ?? 33.8869;
    this.eventLng = ev.location?.coordinates?.lng ?? 9.5375;
    this.eventCapacity = ev.capacity ?? null;
    this.eventStatus = ev.status || 'published';
    this.staffList = Array.isArray(ev.staff)
        ? ev.staff.map((s) => ({
          name: (s.name || '').trim(),
          role: (s.role || '').trim(),
          budget: this.parseStaffBudget(s.budget),
        }))
        : [];
    this.memberInfoForPublic = ev.shortDescription || '';
    this.eventFormat = ev.eventFormat || '';
    this.eventFormatCustom = ev.eventFormatCustom || '';
    this.searchQuery = ev.location?.name || '';
    this.openModal();
  }

  handleAddOrUpdateEvent() {
    this.submitted = true;
    if (!this.isFormValid) return;

    if (this.createEventType === 'virtual') {
      this.handleAddOrUpdateVirtualEvent();
      return;
    }

    const overlap = this.getEventTimeOverlapMessage('physical');
    if (overlap) {
      this.errorMessage = overlap;
      return;
    }

    const location = (this.eventLocationName || this.eventLocationAddress) ? {
      name: this.eventLocationName,
      address: this.eventLocationAddress,
      coordinates: { lat: this.eventLat ?? 0, lng: this.eventLng ?? 0 }
    } : undefined;

    const staffPayload: EventStaffMember[] = this.staffList.map((s) => ({
      name: s.name.trim(),
      role: (s.role || '').trim(),
      budget: s.budget != null && !Number.isNaN(Number(s.budget)) ? Number(s.budget) : undefined,
    }));

    const payload: BackendEvent & { staff?: EventStaffMember[] } = {
      title: this.eventTitle,
      description: this.eventDescription,
      shortDescription: this.memberInfoForPublic.trim() || undefined,
      startDate: this.eventStartDate + ':00',
      endDate: this.eventEndDate + ':00',
      location,
      capacity: this.eventCapacity ?? undefined,
      status: this.eventStatus,
      staff: staffPayload,
      eventFormat: this.eventFormat || undefined,
      eventFormatCustom: this.eventFormat === 'other' ? (this.eventFormatCustom.trim() || undefined) : undefined,
    };

    this.clearMessages();
    if (this.selectedEvent?.id) {
      this.eventService.updateEvent(this.selectedEvent.id, { ...this.selectedEvent, ...payload }).subscribe({
        next: () => { this.loadEvents(); this.closeModal(); this.successMessage = 'Event updated successfully.'; },
        error: (err) => { this.errorMessage = 'Failed to update event: ' + (err.error?.error || 'Unknown error'); }
      });
    } else {
      this.eventService.createEvent(payload).subscribe({
        next: () => { this.loadEvents(); this.closeModal(); this.successMessage = 'Event created successfully.'; },
        error: (err) => {
          if (err.status === 401) {
            console.error('Event creation 401', err);
            let token: string | null = null;
            try {
              const raw = localStorage.getItem('currentUser');
              token = raw ? (JSON.parse(raw)?.token ?? null) : null;
            } catch { /* ignore */ }
            const msg = 'Backend rejected the event creation:\n  '
                + (err.error?.error || err.error?.message || 'Not signed in.')
                + '\n\nLocal session diagnostic:\n'
                + '  localStorage.currentUser.token: '
                + (token ? token.substring(0, 24) + '... (present)' : '<MISSING>')
                + '\n\n' + (token
                    ? 'Token IS present locally but backend says no Bearer header arrived.\n'
                    + 'Open DevTools > Network > the failed POST /api/events request,\n'
                    + 'then look at Request Headers — Authorization should be there.'
                    : 'No token in localStorage — sign out and sign in again.');
            alert(msg);
            return;
          }
          this.errorMessage = 'Failed to create event: ' + (err.error?.error || 'Unknown error');
        }
      });
    }
  }

  deleteEvent() {
    if (this.createEventType === 'virtual') {
      if (!this.selectedVirtualEvent?.id || !confirm('Delete this virtual event?')) return;
      this.virtualEventService.deleteEvent(this.selectedVirtualEvent.id).subscribe({
        next: () => { this.loadEvents(); this.closeModal(); this.successMessage = 'Virtual event deleted successfully.'; },
        error: (err) => { this.errorMessage = 'Failed to delete virtual event: ' + (err.error?.error || 'Unknown error'); }
      });
      return;
    }
    if (!this.selectedEvent?.id || !confirm('Delete this event?')) return;
    this.eventService.deleteEvent(this.selectedEvent.id).subscribe({
      next: () => { this.loadEvents(); this.closeModal(); this.successMessage = 'Event deleted successfully.'; },
      error: (err) => { this.errorMessage = 'Failed to delete event: ' + (err.error?.error || 'Unknown error'); }
    });
  }

  private handleAddOrUpdateVirtualEvent(): void {
    const overlap = this.getEventTimeOverlapMessage('virtual');
    if (overlap) {
      this.errorMessage = overlap;
      return;
    }

    const scheduledAt = this.eventStartDate ? this.eventStartDate + ':00' : '';
    const endAt       = this.eventEndDate   ? this.eventEndDate   + ':00' : undefined;
    if (!scheduledAt) {
      this.errorMessage = 'Start date and time are required for a virtual event.';
      return;
    }

    const payload: VirtualEvent = {
      title:            this.eventTitle.trim(),
      description:      this.eventDescription || undefined,
      category:         this.virtualCategory?.trim() || undefined,
      scheduledAt,
      endAt,
      meetingLink:      this.virtualMeetingLink?.trim() || undefined,
      isRecording:      this.virtualIsRecording,
      price:            this.virtualPrice ?? undefined,
      isPaid:           this.virtualIsPaid,
      maxParticipants:  this.eventCapacity ?? undefined,
      imageUrl:         this.virtualImageUrl?.trim() || undefined,
      type:             this.virtualType,
      roomId:           this.virtualType === 'ROOM' ? (this.virtualRoomId?.trim() || undefined) : undefined,
    };

    this.clearMessages();
    const existing = this.selectedVirtualEvent;
    const obs = existing?.id
        ? this.virtualEventService.updateEvent(existing.id, { ...existing, ...payload })
        : this.virtualEventService.createEvent(payload);

    obs.subscribe({
      next: () => {
        this.loadEvents();
        this.closeModal();
        this.successMessage = existing?.id ? 'Virtual event updated successfully.' : 'Virtual event created successfully.';
      },
      error: (err) => {
        const body = err.error;
        const msg = (typeof body === 'string' ? body : null) || body?.message || body?.error || err?.message || 'HTTP ' + (err.status ?? '') + ' — check that Gateway :8084 and VEM are running.';
        this.errorMessage = 'Failed to save virtual event: ' + msg;
        console.error('Virtual event save failed', err);
      }
    });
  }

  addStaff() {
    this.staffAddError = '';
    const name = this.newStaffName.trim();
    const role = (this.newStaffRoleText || '').trim();
    if (!name) { this.staffAddError = 'Name is required.'; return; }
    if (!role) { this.staffAddError = 'Role is required.'; return; }
    const nameKey = name.toLowerCase();
    const roleKey = this.normalizeRole(role);
    if (this.staffList.some((s) => s.name.trim().toLowerCase() === nameKey && this.normalizeRole(s.role) === roleKey)) {
      this.staffAddError = `${name} is already listed as ${role}.`;
      return;
    }
    const budget = this.newStaffBudget != null && !Number.isNaN(Number(this.newStaffBudget)) ? Number(this.newStaffBudget) : undefined;
    this.staffList = [...this.staffList, { name, role, budget }];
    this.newStaffName = '';
    this.newStaffBudget = null;
  }

  private parseStaffBudget(v: unknown): number | undefined {
    if (v == null || v === '') return undefined;
    const n = typeof v === 'number' ? v : Number(String(v).replace(',', '.'));
    return Number.isFinite(n) && !Number.isNaN(n) ? n : undefined;
  }

  removeStaff(i: number) {
    this.staffList = this.staffList.filter((_, idx) => idx !== i);
  }

  onSearchInput() {
    if (this.searchQuery.length > 2) {
      this.isSearching = true;
      this.showSearchResults = true;
    } else {
      this.isSearching = false;
      this.showSearchResults = false;
    }
    this.searchInput$.next(this.searchQuery);
  }

  selectSearchResult(result: any) {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    this.eventLat = lat;
    this.eventLng = lng;
    this.eventLocationAddress = result.display_name;
    if (!this.eventLocationName) this.eventLocationName = result.display_name.split(',')[0].trim();
    this.searchQuery = result.display_name.split(',')[0].trim();
    this.showSearchResults = false;

    if (this.formMap && this.formMarker) {
      this.formMap.setView([lat, lng], 15);
      this.formMarker.setLatLng([lat, lng]);
    } else {
      this.initFormMap();
    }
  }

  initFormMap() {
    setTimeout(() => {
      const el = document.getElementById('formMap');
      if (!el) return;
      if (this.formMap) { this.formMap.remove(); this.formMap = null; }
      const lat = this.eventLat || 33.8869;
      const lng = this.eventLng || 9.5375;
      this.formMap = L.map('formMap').setView([lat, lng], 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap' }).addTo(this.formMap);
      this.formMarker = L.marker([lat, lng], { draggable: true }).addTo(this.formMap);
      this.formMarker.on('dragend', () => {
        const pos = this.formMarker!.getLatLng();
        this.eventLat = pos.lat;
        this.eventLng = pos.lng;
        this.reverseGeocode(pos.lat, pos.lng);
      });
      this.formMap.on('click', (e: L.LeafletMouseEvent) => {
        this.eventLat = e.latlng.lat;
        this.eventLng = e.latlng.lng;
        this.formMarker?.setLatLng([this.eventLat, this.eventLng]);
        this.reverseGeocode(this.eventLat, this.eventLng);
      });
      this.formMap.invalidateSize();
    }, 400);
  }

  reverseGeocode(lat: number, lng: number) {
    this.locationService.reverseGeocode(lat, lng).subscribe({
      next: (result) => {
        if (result?.display_name) {
          this.eventLocationAddress = result.display_name;
          if (!this.eventLocationName) this.eventLocationName = result.display_name.split(',')[0].trim();
        }
      }
    });
  }

  clearMessages() { this.errorMessage = ''; this.successMessage = ''; }

  private applyDefaultEventWindow(): void {
    const pad = (n: number) => (n < 10 ? '0' + n : String(n));
    const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    const start = new Date();
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
    this.eventStartDate = fmt(start);
    this.eventEndDate = fmt(end);
  }

  resetModalFields() {
    this.createEventType = 'physical';
    this.eventTitle = '';
    this.eventDescription = '';
    this.eventStartDate = '';
    this.eventEndDate = '';
    this.eventLocationName = '';
    this.eventLocationAddress = '';
    this.eventLat = 33.8869;
    this.eventLng = 9.5375;
    this.eventCapacity = null;
    this.eventStatus = 'published';
    this.staffList = [];
    this.newStaffName = '';
    this.newStaffRoleText = 'formateur';
    this.newStaffBudget = null;
    this.staffAddError = '';
    this.memberInfoForPublic = '';
    this.eventFormat = '';
    this.eventFormatCustom = '';
    this.selectedEvent = null;
    this.selectedVirtualEvent = null;
    this.submitted = false;
    this.searchQuery = '';
    this.searchResults = [];
    this.showSearchResults = false;
    this.virtualType = 'VIRTUAL';
    this.virtualRoomId = '';
    this.virtualMeetingLink = '';
    this.virtualPrice = null;
    this.virtualIsPaid = false;
    this.virtualIsRecording = false;
    this.virtualImageUrl = '';
    this.virtualCategory = '';
  }

  openModal() {
    this.isOpen = true;
    if (this.createEventType === 'physical') {
      setTimeout(() => this.initFormMap(), 400);
    }
  }

  closeModal() {
    this.isOpen = false;
    this.resetModalFields();
    if (this.formMap) {
      this.formMap.remove();
      this.formMap = null;
    }
  }

  // ── AI feedback summary ──────────────────────────────────────
  aiSummaryOpen = false;
  aiSummaryEventId: string | null = null;
  aiSummaryEventTitle = '';

  canViewAiSummary(): boolean {
    if (!this.selectedEvent?.id) return false;
    const status = (this.selectedEvent.status || '').toLowerCase();
    if (status === 'completed') return true;
    if (this.selectedEvent.endDate) {
      const end = new Date(this.selectedEvent.endDate).getTime();
      return Number.isFinite(end) && end < Date.now();
    }
    return false;
  }

  openAiSummary(): void {
    if (!this.selectedEvent?.id) return;
    this.aiSummaryEventId = this.selectedEvent.id;
    this.aiSummaryEventTitle = this.selectedEvent.title || '';
    this.aiSummaryOpen = true;
  }

  closeAiSummary(): void {
    this.aiSummaryOpen = false;
    this.aiSummaryEventId = null;
    this.aiSummaryEventTitle = '';
  }

  // ── Custom-ML feedback sentiment ─────────────────────────────
  sentimentOpen = false;
  sentimentEventId: string | null = null;
  sentimentEventTitle = '';

  canViewSentiment(): boolean { return this.canViewAiSummary(); }

  openSentiment(): void {
    if (!this.selectedEvent?.id) return;
    this.sentimentEventId = this.selectedEvent.id;
    this.sentimentEventTitle = this.selectedEvent.title || '';
    this.sentimentOpen = true;
  }

  closeSentiment(): void {
    this.sentimentOpen = false;
    this.sentimentEventId = null;
    this.sentimentEventTitle = '';
  }

  onSuggestedFormat(format: string) {
    const canonical = this.eventFormatOptions.find(o => o.id === format);
    if (canonical) {
      this.eventFormat = canonical.id;
      this.eventFormatCustom = '';
    } else {
      this.eventFormat = 'other';
      this.eventFormatCustom = format;
    }
    this.successMessage = `Format set to "${format}" from your past-events analysis.`;
    setTimeout(() => { if (this.successMessage.startsWith('Format set')) this.successMessage = ''; }, 4000);
  }

  onSuggestedStaff(s: StaffRecommendation) {
    this.newStaffName = s.name;
    this.newStaffRoleText = s.role || this.newStaffRoleText;
    this.staffAddError = '';
  }

  onSuggestedTiming(t: SuggestedTiming) {
    console.log('[Calendar] applyTiming clicked:', t);
    if (!t) return;
    let start: Date | null = null;
    if (t.suggestedDate) {
      const candidate = new Date(t.suggestedDate);
      if (!isNaN(candidate.getTime())) start = candidate;
    }
    if (!start && t.dayOfWeek) {
      start = this.nextOccurrenceOfDay(t.dayOfWeek, t.typicalHour ?? 18);
    }
    if (!start) {
      this.successMessage = "Couldn't parse the suggested date — try clicking again.";
      setTimeout(() => { this.successMessage = ''; }, 3000);
      return;
    }
    const hour = Math.max(8, Math.min(22, t.typicalHour ?? start.getHours() ?? 18));
    start.setHours(hour, 0, 0, 0);
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
    const fmt = (d: Date) => {
      const pad = (n: number) => (n < 10 ? '0' + n : '' + n);
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };
    this.eventStartDate = fmt(start);
    this.eventEndDate   = fmt(end);
    this.successMessage = `📅 Date pre-filled : ${t.dayOfWeek} ${t.timeOfDay} → ${this.eventStartDate.replace('T', ' ')}`;
    setTimeout(() => { if (this.successMessage.startsWith('📅 Date pre-filled')) this.successMessage = ''; }, 4000);
  }

  suggestDescription(): void {
    if (!this.eventTitle?.trim() || this.drafting) return;
    this.drafting = true;
    this.draftError = '';
    const fmt = this.eventFormat === 'other' ? this.eventFormatCustom : this.eventFormat;
    this.recoService.describeEvent(this.eventTitle.trim(), fmt || undefined, 'fr').subscribe({
      next: (res) => {
        this.drafting = false;
        if (!res?.description) {
          this.draftError = res?.hint || 'AI returned an empty draft. Try a more specific title.';
          return;
        }
        this.eventDescription = this.eventDescription?.trim()
            ? `${this.eventDescription.trim()}\n\n${res.description}`
            : res.description;
      },
      error: (err) => {
        this.drafting = false;
        const status = err?.status ?? 0;
        this.draftError = status === 0
            ? 'Backend unreachable. Is the gateway running?'
            : `AI draft failed (HTTP ${status}). Write the description manually.`;
        console.warn('[Calendar] description draft failed:', err);
      }
    });
  }

  private nextOccurrenceOfDay(dayName: string, hour: number): Date {
    const map: Record<string, number> = {
      sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6,
    };
    const target = map[(dayName ?? '').toLowerCase().trim()];
    const today = new Date();
    if (target === undefined) {
      today.setDate(today.getDate() + 7);
      today.setHours(hour, 0, 0, 0);
      return today;
    }
    const diff = (target - today.getDay() + 7) % 7 || 7;
    const next = new Date(today);
    next.setDate(today.getDate() + diff);
    next.setHours(hour, 0, 0, 0);
    return next;
  }

  renderEventContent(arg: any) {
    const color = arg.event.backgroundColor;
    const time = arg.timeText ? `<span style="font-size:10px;opacity:.8;">${arg.timeText}</span>` : '';
    const virtual = arg.event.extendedProps?.['virtualEvent'] as VirtualEvent | undefined;
    if (virtual) {
      return {
        html: `<div style="background:${color};border-radius:5px;padding:3px 6px;">
                 ${time}
                 <div style="font-size:12px;font-weight:600;color:#fff;">
                   <span style="display:inline-block;background:rgba(255,255,255,.22);padding:0 4px;border-radius:3px;font-size:9px;margin-right:4px;">ONLINE</span>
                   ${arg.event.title}
                 </div>
               </div>`
      };
    }
    const be = arg.event.extendedProps?.['backendEvent'] as BackendEvent | undefined;
    const fmt = be ? eventFormatShort(be.eventFormat, be.eventFormatCustom) : '';
    const fmtHtml = fmt ? `<div style="font-size:9px;opacity:.88;margin-top:1px;line-height:1.1;">${fmt.replace(/</g, '&lt;')}</div>` : '';
    return {
      html: `<div style="background:${color};border-radius:5px;padding:3px 6px;">
               ${time}
               <div style="font-size:12px;font-weight:600;color:#fff;">${arg.event.title}</div>
               ${fmtHtml}
             </div>`
    };
  }

  toggleVirtualEvents(): void {
    this.showVirtualEvents = !this.showVirtualEvents;
    this.loadEvents();
  }

  // ═══════════════════════════════════════════════════════════
  //  Chatbot methods (virtual event creation assistant)
  // ═══════════════════════════════════════════════════════════

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

MODE 1 - EXTRACTION: Si l'utilisateur décrit un événement ou une formation, extrais les informations et retourne UNIQUEMENT ce JSON:
{
  "mode": "extract",
  "title": "string (si manquant, invente un titre pertinent basé sur le thème)",
  "description": "string détaillée ou null",
  "category": "string (Tech/Business/Design/Marketing/RH/Finance/Jeux/Loisirs/Autre) ou null",
  "scheduledAt": "ISO 8601 ex: 2026-06-15T14:00:00 (si non précisé, utilise le prochain samedi à 10h)",
  "endAt": "ISO 8601 ou null (ajoute 2h par défaut si durée non précisée)",
  "isRecording": true,
  "price": number (0 si gratuit),
  "isPaid": true ou false (si gratuit, mets false),
  "maxParticipants": number (estime si non fourni),
  "imageUrl": "une URL Unsplash pertinente ou null",
  "status": "UPCOMING",
  "type": "VIRTUAL" ou "ROOM",
  "roomId": null
}

MODE 2 - SUGGESTION: Si l'utilisateur demande des idées, propositions ou exemples, retourne UNIQUEMENT ce JSON:
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

RÈGLE ABSOLUE: Retourne UNIQUEMENT le JSON, rien d'autre, pas de markdown. Même si la demande est vague (ex: "Je veux créer un événement de jeu"), invente des détails raisonnables et renvoie le JSON d'extraction.`;
    this.http.post(
        this.aiParseApi,
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

    this.eventTitle = parsed.title || '';
    this.eventDescription = parsed.description || '';
    this.eventStartDate = toLocalFormat(parsed.scheduledAt);
    this.eventEndDate = toLocalFormat(parsed.endAt);
    this.eventCapacity = parsed.maxParticipants ?? null;
    this.virtualPrice = parsed.price ?? null;
    this.virtualIsPaid = parsed.isPaid ?? false;
    this.virtualIsRecording = parsed.isRecording ?? true;
    this.virtualImageUrl = parsed.imageUrl || '';
    this.virtualCategory = parsed.category || '';
    this.virtualType = parsed.type || 'VIRTUAL';
    this.virtualRoomId = parsed.roomId || '';

    this.createEventType = (parsed.type === 'ROOM' || parsed.type === 'VIRTUAL') ? 'virtual' : 'physical';

    if (!this.isOpen) {
      this.resetModalFields();
      setTimeout(() => {
        this.eventTitle = parsed.title || '';
        this.eventDescription = parsed.description || '';
        this.eventStartDate = toLocalFormat(parsed.scheduledAt);
        this.eventEndDate = toLocalFormat(parsed.endAt);
        this.eventCapacity = parsed.maxParticipants ?? null;
        this.virtualPrice = parsed.price ?? null;
        this.virtualIsPaid = parsed.isPaid ?? false;
        this.virtualIsRecording = parsed.isRecording ?? true;
        this.virtualImageUrl = parsed.imageUrl || '';
        this.virtualCategory = parsed.category || '';
        this.virtualType = parsed.type || 'VIRTUAL';
        this.virtualRoomId = parsed.roomId || '';
        this.createEventType = (parsed.type === 'ROOM' || parsed.type === 'VIRTUAL') ? 'virtual' : 'physical';
      });
      this.openModal();
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
}