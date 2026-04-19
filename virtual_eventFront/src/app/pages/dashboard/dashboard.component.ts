import { Component, OnInit } from '@angular/core';
import { VirtualEventService } from '../../services/virtual-event.service';
import { VirtualEvent } from '../../models/virtual-event';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  events: VirtualEvent[] = [];

  totalEvents = 0;
  totalParticipants = 0;
  totalRevenue = 0;

  recentEvents: VirtualEvent[] = [];

  constructor(private eventService: VirtualEventService) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard() {
    this.eventService.getAllEvents().subscribe(events => {
      this.events = events;

      // 📊 TOTAL EVENTS
      this.totalEvents = events.length;

      // 👥 TOTAL PARTICIPANTS
      this.totalParticipants = events.reduce((sum, e) =>
        sum + (e.currentParticipants || 0), 0);

      // 💰 TOTAL REVENUE
      this.totalRevenue = events.reduce((sum, e) =>
        sum + ((e.isPaid ? (e.price || 0) * (e.currentParticipants || 0) : 0)), 0);

      // 📅 RECENT EVENTS
      this.recentEvents = events
        .sort((a, b) =>
          new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()
        )
        .slice(0, 5);
    });
  }
}