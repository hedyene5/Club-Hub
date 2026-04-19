import { Component, OnInit } from '@angular/core';
import { VirtualEventService } from '../../services/virtual-event.service';
import { VirtualEvent } from '../../models/virtual-event';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-management',
  templateUrl: './management.component.html'
})
export class ManagementComponent implements OnInit {

  events: VirtualEvent[] = [];
  selectedTab = 'events';

  constructor(
    private eventService: VirtualEventService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.loadEvents();
  }

  loadEvents() {
    this.eventService.getAllEvents().subscribe(res => {
      this.events = res;
    });
  }

  deleteEvent(id: string) {
    this.eventService.deleteEvent(id).subscribe(() => {
      this.loadEvents();
    });
  }

  // 🔥 FAKE participants (car pas endpoint direct)
  registrations: any[] = [];

  loadRegistrations(eventId: string) {
    this.selectedTab = 'participants';

    this.http.get(`http://localhost:8082/api/registrations/event/${eventId}`)
      .subscribe((res: any) => {
        this.registrations = res;
      });
  }

}