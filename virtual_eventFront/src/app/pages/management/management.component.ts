import { Component, OnInit } from '@angular/core';
import { VirtualEventService } from '../../services/virtual-event.service';

@Component({
  selector: 'app-management',
  templateUrl: './management.component.html',
  styleUrls: ['./management.component.css']
})
export class ManagementComponent implements OnInit {

  events: any[] = [];

  constructor(private eventService: VirtualEventService) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.eventService.getAllEvents().subscribe(res => this.events = res);
  }

  delete(id: string) {
    this.eventService.deleteEvent(id).subscribe(() => this.load());
  }
}