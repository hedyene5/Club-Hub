import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { apiUrl } from '../../../../environments/environment';

interface AudioReport {
  id: string;
  reportedByUserName: string;
  reportedUserName: string;
  reason: string;
  status: string;
  createdAt: string;
}

@Component({
  selector: 'app-voice2-audio-reports',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './audio-reports.component.html',
})
export class Voice2AudioReportsComponent implements OnInit {
  reports: AudioReport[] = [];
  loading = false;
  error = '';
  private readonly api = apiUrl('/api/voice2/reports');

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loading = true;
    this.error = '';
    this.http.get<AudioReport[]>(this.api).subscribe({
      next: (rows) => {
        this.reports = rows;
        this.loading = false;
      },
      error: (err: HttpErrorResponse) => {
        const detail =
          (typeof err.error === 'string' && err.error) ||
          err.error?.message ||
          '';
        this.error = detail
          ? `Unable to load reports (${err.status}): ${detail}`
          : `Unable to load reports (${err.status}).`;
        console.error('[voice2] load reports failed', {
          url: this.api,
          status: err.status,
          statusText: err.statusText,
          error: err.error,
        });
        this.loading = false;
      },
    });
  }
}
