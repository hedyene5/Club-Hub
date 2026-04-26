import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { apiUrl } from '../../../../environments/environment';
import { AuthService } from '../../../shared/services/auth.service';

interface AudioReport {
  id: string;
  reportedUserName: string;
  reason: string;
  status: string;
  createdAt: string;
}

@Component({
  selector: 'app-voice2-my-reports',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './my-reports.component.html',
})
export class Voice2MyReportsComponent implements OnInit {
  reports: AudioReport[] = [];
  loading = false;
  error = '';
  private readonly api = apiUrl('/api/voice2/reports');

  constructor(private http: HttpClient, private auth: AuthService) {}

  ngOnInit(): void {
    const user = this.auth.getCurrentUser();
    if (!user?.userId) {
      this.error = 'User session not found.';
      return;
    }
    this.loading = true;
    this.error = '';
    this.http
      .get<AudioReport[]>(`${this.api}?reportedByUserId=${encodeURIComponent(user.userId)}`)
      .subscribe({
        next: (rows) => {
          this.reports = rows;
          this.loading = false;
        },
        error: () => {
          this.error = 'Unable to load your reports.';
          this.loading = false;
        },
      });
  }
}
