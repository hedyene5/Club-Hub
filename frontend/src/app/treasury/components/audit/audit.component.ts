import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { TreasuryApiService } from '../../services/treasury-api.service';
import { AuditLog, MockUser } from '../../models/treasury.models';

@Component({
  selector: 'app-audit',
  standalone: true,
  imports: [CommonModule, DatePipe],
  template: `
    <div class="p-6 space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-2xl font-bold text-gray-800 dark:text-white">Journal d'Audit</h2>
          <p class="text-sm text-gray-500 mt-1">Historique immuable de toutes les actions (BF9)</p>
        </div>
        <span class="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
          {{ allLogs.length }} entrees
        </span>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="bg-white dark:bg-gray-800 rounded-xl border p-4">
          <p class="text-sm text-gray-500">Paiements</p>
          <p class="text-2xl font-bold text-blue-600">{{ countByType('Payment') }}</p>
        </div>
        <div class="bg-white dark:bg-gray-800 rounded-xl border p-4">
          <p class="text-sm text-gray-500">Depenses</p>
          <p class="text-2xl font-bold text-orange-600">{{ countByType('Expense') }}</p>
        </div>
        <div class="bg-white dark:bg-gray-800 rounded-xl border p-4">
          <p class="text-sm text-gray-500">Budgets</p>
          <p class="text-2xl font-bold text-green-600">{{ countByType('Budget') }}</p>
        </div>
        <div class="bg-white dark:bg-gray-800 rounded-xl border p-4">
          <p class="text-sm text-gray-500">Recus</p>
          <p class="text-2xl font-bold text-purple-600">{{ countByType('Receipt') }}</p>
        </div>
      </div>

      <!-- Loading -->
      <div *ngIf="loading" class="text-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p class="mt-3 text-gray-500">Chargement du journal...</p>
      </div>

      <!-- Logs table -->
      <div *ngIf="!loading" class="bg-white dark:bg-gray-800 rounded-xl border overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acteur</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entite</th>
                <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Montant</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
              <tr *ngFor="let log of logs" class="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td class="px-4 py-3 text-gray-600 whitespace-nowrap">{{ log.timestamp | date:'dd/MM/yy HH:mm' }}</td>
                <td class="px-4 py-3">
                  <span class="text-gray-800 dark:text-white font-medium">{{ resolveMember(log.actorId) }}</span>
                  <span class="text-gray-400 text-xs ml-1">({{ log.actorEmail }})</span>
                </td>
                <td class="px-4 py-3">
                  <span [class]="actionClass(log.action)" class="px-2 py-1 rounded-full text-xs font-medium">
                    {{ formatAction(log.action) }}
                  </span>
                </td>
                <td class="px-4 py-3 text-gray-600">{{ log.entityType }} #{{ log.entityId }}</td>
                <td class="px-4 py-3 text-right font-medium" [class.text-green-600]="log.amount && log.amount > 0">
                  {{ log.amount ? (log.amount | number:'1.2-2') + ' TND' : '-' }}
                </td>
                <td class="px-4 py-3 text-gray-500 text-xs max-w-xs truncate">
                  {{ log.valuesAfter || '-' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div *ngIf="allLogs.length === 0" class="text-center py-12 text-gray-400">
          Aucune entree dans le journal d'audit.
        </div>

        <!-- Pagination -->
        <div *ngIf="totalPages > 1" class="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
          <span class="text-sm text-gray-500">Page {{page+1}} / {{totalPages}} ({{total}} elements)</span>
          <div class="flex gap-2">
            <button (click)="page=page-1; applyView()" [disabled]="page===0" class="px-3 py-1 text-sm border rounded-lg hover:bg-gray-50 disabled:opacity-40 dark:border-gray-600 dark:hover:bg-gray-700">Precedent</button>
            <button (click)="page=page+1; applyView()" [disabled]="page>=totalPages-1" class="px-3 py-1 text-sm border rounded-lg hover:bg-gray-50 disabled:opacity-40 dark:border-gray-600 dark:hover:bg-gray-700">Suivant</button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class AuditComponent implements OnInit {
  clubId = 1;
  allLogs: AuditLog[] = [];
  logs: AuditLog[] = [];
  loading = true;
  error = '';

  // Pagination
  page = 0;
  pageSize = 10;
  get total(): number { return this.allLogs.length; }
  get totalPages(): number { return Math.max(1, Math.ceil(this.total / this.pageSize)); }

  // Member name resolution
  memberNames = new Map<string, string>();

  constructor(private api: TreasuryApiService, private http: HttpClient) {}

  ngOnInit() {
    this.loadMembers();
    this.api.getAuditLogs(this.clubId).subscribe({
      next: (data) => { this.allLogs = data; this.applyView(); this.loading = false; },
      error: () => { this.error = 'Impossible de charger le journal d audit.'; this.loading = false; }
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
    return this.memberNames.get(id) || '#' + id;
  }

  applyView() {
    const start = this.page * this.pageSize;
    this.logs = this.allLogs.slice(start, start + this.pageSize);
  }

  countByType(type: string): number {
    return this.allLogs.filter(l => l.entityType === type).length;
  }

  formatAction(action: string): string {
    const map: Record<string, string> = {
      'PAYMENT_CREATED': 'Paiement cree',
      'PAYMENT_UPDATED': 'Paiement MAJ',
      'PAYMENT_REFUNDED': 'Remboursement',
      'EXPENSE_SUBMITTED': 'Depense soumise',
      'EXPENSE_VALIDATED': 'Depense validee',
      'EXPENSE_APPROVED': 'Depense approuvee',
      'EXPENSE_REJECTED': 'Depense rejetee',
      'COTISATION_RULE_CREATED': 'Regle creee',
      'COTISATION_RULE_UPDATED': 'Regle MAJ',
      'BUDGET_CREATED': 'Budget cree',
      'BUDGET_UPDATED': 'Budget MAJ',
      'RECEIPT_GENERATED': 'Recu genere',
    };
    return map[action] ?? action;
  }

  actionClass(action: string): string {
    if (action.includes('APPROVED') || action.includes('CREATED')) return 'bg-green-100 text-green-700';
    if (action.includes('REJECTED')) return 'bg-red-100 text-red-700';
    if (action.includes('REFUNDED')) return 'bg-blue-100 text-blue-700';
    if (action.includes('VALIDATED') || action.includes('UPDATED')) return 'bg-yellow-100 text-yellow-700';
    return 'bg-gray-100 text-gray-600';
  }

}
