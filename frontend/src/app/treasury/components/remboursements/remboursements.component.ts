import { Component, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { TreasuryApiService } from '../../services/treasury-api.service';
import { Payment, MockUser } from '../../models/treasury.models';

@Component({
  selector: 'app-remboursements',
  standalone: true,
  imports: [CommonModule, DecimalPipe, DatePipe],
  templateUrl: './remboursements.component.html',
})
export class RemboursementsComponent implements OnInit {
  clubId = 1;
  allPaid: Payment[] = [];
  paid: Payment[] = [];
  refunded: Payment[] = [];
  loading = true;
  error = '';
  selectedPayments: string[] = [];

  // Pagination
  page = 0;
  pageSize = 10;
  get total(): number { return this.allPaid.length; }
  get totalPages(): number { return Math.max(1, Math.ceil(this.total / this.pageSize)); }

  // Member name resolution
  memberNames = new Map<string, string>();

  constructor(private api: TreasuryApiService, private http: HttpClient) {}

  ngOnInit() {
    this.loadMembers();
    this.api.getPayments(this.clubId).subscribe({
      next: (data) => {
        this.allPaid = data.filter(p => p.status === 'PAID');
        this.refunded = data.filter(p => p.status === 'REFUNDED' || p.status === 'PARTIALLY_REFUNDED');
        this.applyView();
        this.loading = false;
      },
      error: () => { this.error = 'Impossible de charger les remboursements.'; this.loading = false; }
    });
  }

  loadMembers() {
    this.http.get<MockUser[]>('http://localhost:8084/api/v1/users/club/1').subscribe({
      next: (users) => {
        users.forEach(u => this.memberNames.set(u.id, u.firstName + ' ' + u.lastName));
        this.applyView();
      },
      error: () => {}
    });
  }

  resolveMember(id: string): string {
    return this.memberNames.get(id) || 'Membre #' + id;
  }

  applyView() {
    const start = this.page * this.pageSize;
    this.paid = this.allPaid.slice(start, start + this.pageSize);
  }

  onPageChange() {
    this.applyView();
  }

  toggle(id: string) {
    const i = this.selectedPayments.indexOf(id);
    if (i === -1) this.selectedPayments.push(id); else this.selectedPayments.splice(i, 1);
  }

  isSelected(id: string) { return this.selectedPayments.includes(id); }

  initiateRefunds() {
    if (!this.selectedPayments.length) return;
    alert(`Remboursement initié pour ${this.selectedPayments.length} paiement(s). Stripe traitera sous 3-5 jours ouvrés.`);
    this.selectedPayments = [];
  }

}
