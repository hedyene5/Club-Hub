import { Component, OnInit } from '@angular/core';
import { VirtualEventService } from '../../services/virtual-event.service';

@Component({
  selector: 'app-analytics',
  templateUrl: './analytics.component.html'
})
export class AnalyticsComponent implements OnInit {

  totalEvents = 0;
  totalParticipants = 0;

  constructor(private eventService: VirtualEventService) {}

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats() {
    this.eventService.getAllEvents().subscribe(events => {
      this.totalEvents = events.length;

      this.totalParticipants = events.reduce((sum, e) =>
        sum + (e.currentParticipants || 0), 0);
    });
  }
}