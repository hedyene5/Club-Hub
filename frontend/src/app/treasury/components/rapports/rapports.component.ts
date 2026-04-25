import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-rapports',
  standalone: true,
  imports: [CommonModule, DecimalPipe, FormsModule],
  templateUrl: './rapports.component.html',
})
export class RapportsComponent implements OnInit {
  clubId = 1;
  loading = false;
  error = '';
  success = '';
  bilan: any = null;
  customStart = '';
  customEnd = '';

  // Periodes auto-detectees
  availablePeriods: { label: string; type: string; param: number; start: string; end: string }[] = [];

  private http = inject(HttpClient);
  private base = 'http://localhost:8084/api/v1/treasury';

  ngOnInit() {
    this.detectPeriods();
  }

  /** Detecte automatiquement les periodes disponibles basees sur les paiements */
  private detectPeriods() {
    this.http.get<any[]>(`${this.base}/${this.clubId}/payments`).subscribe({
      next: (payments) => {
        const dates = payments
          .map(p => p.dueDate || p.paidAt)
          .filter(Boolean)
          .map(d => new Date(d))
          .sort((a, b) => a.getTime() - b.getTime());

        if (dates.length === 0) return;

        const earliest = dates[0];
        const latest = dates[dates.length - 1];

        // Annee scolaire
        const startYear = earliest.getMonth() >= 8 ? earliest.getFullYear() : earliest.getFullYear() - 1;
        this.availablePeriods.push({
          label: `Bilan annuel ${startYear}/${startYear + 1}`,
          type: 'custom',
          param: 0,
          start: `${startYear}-09-01`,
          end: `${startYear + 1}-08-31`
        });

        // Semestres
        this.availablePeriods.push({
          label: `S1 (Sep-Fev ${startYear}/${startYear + 1})`,
          type: 'custom', param: 0,
          start: `${startYear}-09-01`,
          end: `${startYear + 1}-02-28`
        });
        this.availablePeriods.push({
          label: `S2 (Mar-Aout ${startYear + 1})`,
          type: 'custom', param: 0,
          start: `${startYear + 1}-03-01`,
          end: `${startYear + 1}-08-31`
        });

        // Trimestres
        const trims = [
          { q: 'T1', m1: 9, m2: 11, y: startYear },
          { q: 'T2', m1: 12, m2: 2, y: startYear },
          { q: 'T3', m1: 3, m2: 5, y: startYear + 1 },
          { q: 'T4', m1: 6, m2: 8, y: startYear + 1 },
        ];
        for (const t of trims) {
          const sy = t.m1 >= 9 ? t.y : t.y + 1;
          const ey = t.m2 <= 2 ? t.y + 1 : t.y + 1;
          const sm = String(t.m1).padStart(2, '0');
          const em = String(t.m2).padStart(2, '0');
          this.availablePeriods.push({
            label: `${t.q} (${this.monthName(t.m1)}-${this.monthName(t.m2)} ${t.m1 >= 9 ? t.y : t.y + 1})`,
            type: 'custom', param: 0,
            start: `${t.m1 >= 9 ? t.y : t.y + 1}-${sm}-01`,
            end: `${t.m2 <= 2 ? t.y + 1 : t.y + 1}-${em}-${t.m2 === 2 ? '28' : '30'}`
          });
        }
      }
    });
  }

  generatePeriod(p: { label: string; start: string; end: string }) {
    this.loading = true;
    this.error = '';
    this.bilan = null;
    this.http.get<any>(`${this.base}/${this.clubId}/bilans?start=${p.start}&end=${p.end}&label=${encodeURIComponent(p.label)}`).subscribe({
      next: (data) => { this.bilan = this.mapBilan(data, p.label, p.start, p.end); this.loading = false; },
      error: (e) => { this.error = 'Erreur: ' + (e.error?.message || e.status); this.loading = false; }
    });
  }

  generateCustomBilan() {
    if (!this.customStart || !this.customEnd) return;
    this.generatePeriod({ label: 'Bilan personnalise', start: this.customStart, end: this.customEnd });
  }

  exportBilanPdf() {
    if (!this.bilan) return;
    const start = this.bilan.periodStart || this.customStart;
    const end = this.bilan.periodEnd || this.customEnd;
    const label = encodeURIComponent(this.bilan.label || 'Bilan');
    this.http.get(`${this.base}/${this.clubId}/bilans/pdf?start=${start}&end=${end}&label=${label}`, { responseType: 'blob' }).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `bilan-${start}-${end}.pdf`; a.click();
        URL.revokeObjectURL(url);
        this.success = 'PDF telecharge !';
      },
      error: () => { this.error = 'Erreur generation PDF.'; }
    });
  }

  exportCSV() {
    if (!this.bilan) return;
    const rows = [
      ['Poste', 'Montant (TND)'],
      ['Recettes encaissees', this.bilan.totalCollected],
      ['Recettes en attente', this.bilan.totalPending],
      ['Recettes en retard', this.bilan.totalLate],
      ['Depenses approuvees', this.bilan.totalExpenses],
      ['Solde net', this.bilan.solde],
      ['Taux de recouvrement (%)', this.bilan.recoveryRate],
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'bilan-export.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  /** Map les noms du backend vers ceux du template */
  private mapBilan(data: any, label: string, start: string, end: string): any {
    return {
      label: data.periodLabel || label,
      periodStart: data.startDate || start,
      periodEnd: data.endDate || end,
      totalCollected: data.totalRevenues || 0,
      totalPending: data.totalExpensesPending || 0,
      totalExpenses: data.totalExpensesApproved || 0,
      solde: data.solde || 0,
      recoveryRate: data.recoveryRate || 0,
      paidCount: data.totalPaymentsPaid || 0,
      lateCount: data.totalPaymentsLate || 0,
      pendingCount: data.totalPaymentsPending || 0,
    };
  }

  private monthName(m: number): string {
    return ['Jan','Fev','Mar','Avr','Mai','Juin','Juil','Aout','Sep','Oct','Nov','Dec'][m - 1] || '';
  }
}
