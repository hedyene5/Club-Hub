import { Component, OnInit } from '@angular/core';
import { DashboardService } from '../../services/dashboard.service';
import { Chart } from 'chart.js/auto';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit {

  stats: any;
  events: any[] = [];

  constructor(private dashboardService: DashboardService) {}

  ngOnInit() {
    this.loadData();

    // 🔥 refresh auto toutes les 5 secondes
    setInterval(() => {
      this.loadData();
    }, 5000);
  }

  loadData() {
    this.dashboardService.getStats().subscribe(res => {
      this.stats = res;
      this.createChart();
    });

    this.dashboardService.getEvents().subscribe(res => {
      this.events = res;
    });
  }

  // 📊 CHART
  createChart() {

    if (!this.stats) return;

    new Chart("statsChart", {
      type: 'bar',
      data: {
        labels: ['Events', 'Registrations', 'Participants'],
        datasets: [{
          label: 'Statistics',
          data: [
            this.stats.totalEvents,
            this.stats.totalRegistrations,
            this.stats.totalParticipants
          ]
        }]
      }
    });
  }

  // 🔥 TOP EVENTS
  getTopEvents() {
    return this.events
      .sort((a, b) => (b.currentParticipants || 0) - (a.currentParticipants || 0))
      .slice(0, 3);
  }
}