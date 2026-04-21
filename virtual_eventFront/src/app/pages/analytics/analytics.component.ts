import { Component, OnInit } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import { VirtualEventService } from '../../services/virtual-event.service';
import { ChartConfiguration } from 'chart.js';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [BaseChartDirective],
  templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.css']
})
export class AnalyticsComponent implements OnInit {

  totalEvents = 0;
  totalParticipants = 0;
  totalRevenue = 0;

  pieChartData: ChartConfiguration<'pie'>['data'] = {
    labels: ['Paid', 'Free'],
    datasets: [{ data: [0, 0] }]
  };

  lineChartData: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: [{ data: [], label: 'Events / Month' }]
  };

  constructor(private eventService: VirtualEventService) {}

  ngOnInit() {
    this.eventService.getAllEvents().subscribe((res: any[]) => {

      this.totalEvents = res.length;

      this.totalParticipants = res.reduce((s, e) =>
        s + (e.currentParticipants || 0), 0);

      this.totalRevenue = res.reduce((s, e) =>
        e.isPaid ? s + ((e.price || 0) * (e.currentParticipants || 0)) : s, 0);

      const paid = res.filter(e => e.isPaid).length;
      const free = res.filter(e => !e.isPaid).length;
      this.pieChartData.datasets[0].data = [paid, free];

      const months: any = {};
      res.forEach(e => {
        const m = new Date(e.scheduledAt).getMonth() + 1;
        months[m] = (months[m] || 0) + 1;
      });

      this.lineChartData.labels = Object.keys(months);
      this.lineChartData.datasets[0].data = Object.values(months);
    });
  }
}