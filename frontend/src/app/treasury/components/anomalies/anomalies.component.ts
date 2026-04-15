import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { TreasuryApiService } from '../../services/treasury-api.service';
import { AnomalyAlert } from '../../models/treasury.models';

@Component({
  selector: 'app-anomalies',
  standalone: true,
  imports: [CommonModule, DatePipe],
  template: `
    <div class="p-6 space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-2xl font-bold text-gray-800 dark:text-white">Detection d'Anomalies</h2>
          <p class="text-sm text-gray-500 mt-1">Analyse Z-Score sur les transactions (BF12)</p>
        </div>
        <span class="px-3 py-1 rounded-full text-sm font-medium"
              [class.bg-green-100]="anomalies.length === 0" [class.text-green-700]="anomalies.length === 0"
              [class.bg-red-100]="anomalies.length > 0" [class.text-red-700]="anomalies.length > 0">
          {{ anomalies.length }} anomalie{{ anomalies.length !== 1 ? 's' : '' }} detectee{{ anomalies.length !== 1 ? 's' : '' }}
        </span>
      </div>

      <div *ngIf="loading" class="text-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p class="mt-3 text-gray-500">Analyse des transactions en cours...</p>
      </div>

      <!-- No anomalies -->
      <div *ngIf="!loading && anomalies.length === 0" class="bg-green-50 dark:bg-green-900/20 border border-green-200 rounded-xl p-8 text-center">
        <p class="text-4xl mb-3">OK</p>
        <h3 class="font-semibold text-green-700 text-lg">Aucune anomalie detectee</h3>
        <p class="text-sm text-green-600 mt-1">Toutes les transactions sont dans les limites normales.</p>
      </div>

      <!-- Anomalies list -->
      <div *ngIf="!loading && anomalies.length > 0" class="space-y-4">
        <div *ngFor="let a of anomalies" class="bg-white dark:bg-gray-800 rounded-xl border p-5"
             [class.border-red-300]="a.confidenceScore >= 80"
             [class.border-yellow-300]="a.confidenceScore >= 60 && a.confidenceScore < 80"
             [class.border-gray-200]="a.confidenceScore < 60">

          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="flex items-center gap-3 mb-2">
                <span [class]="typeClass(a.type)" class="px-2 py-1 rounded-full text-xs font-medium">
                  {{ formatType(a.type) }}
                </span>
                <span class="text-xs text-gray-400">{{ a.detectedAt | date:'dd/MM/yy HH:mm' }}</span>
              </div>
              <p class="text-gray-800 dark:text-white">{{ a.description }}</p>
              <p class="text-xs text-gray-400 mt-1" *ngIf="a.paymentId">Paiement #{{ a.paymentId }}</p>
              <p class="text-xs text-gray-400 mt-1" *ngIf="a.expenseId">Depense #{{ a.expenseId }}</p>
            </div>

            <!-- Confidence gauge -->
            <div class="text-center ml-4">
              <div class="w-16 h-16 rounded-full flex items-center justify-center border-4"
                   [class.border-red-500]="a.confidenceScore >= 80"
                   [class.border-yellow-500]="a.confidenceScore >= 60 && a.confidenceScore < 80"
                   [class.border-gray-300]="a.confidenceScore < 60">
                <span class="text-sm font-bold"
                      [class.text-red-600]="a.confidenceScore >= 80"
                      [class.text-yellow-600]="a.confidenceScore >= 60 && a.confidenceScore < 80">
                  {{ a.confidenceScore }}%
                </span>
              </div>
              <p class="text-xs text-gray-400 mt-1">Confiance</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Method explanation -->
      <div *ngIf="!loading" class="bg-gray-50 dark:bg-gray-800 rounded-xl border p-4">
        <h3 class="font-medium text-gray-700 dark:text-gray-300 mb-2">Algorithme</h3>
        <p class="text-sm text-gray-500">
          Detection par <strong>Z-Score</strong> : calcul de l'ecart-type des montants de transactions.
          Un Z-Score > 2.0 indique une anomalie (montant anormalement eleve ou bas).
          Detection supplementaire des <strong>doubles paiements suspects</strong> (meme membre, meme montant, &lt;24h d'ecart).
        </p>
      </div>
    </div>
  `,
})
export class AnomaliesComponent implements OnInit {
  clubId = 1;
  anomalies: AnomalyAlert[] = [];
  loading = true;
  error = '';

  constructor(private api: TreasuryApiService) {}

  ngOnInit() {
    this.api.getAnomalies(this.clubId).subscribe({
      next: (data) => { this.anomalies = data; this.loading = false; },
      error: () => { this.error = 'Impossible de charger les anomalies.'; this.loading = false; }
    });
  }

  typeClass(type: string): string {
    if (type === 'DOUBLE_PAIEMENT_SUSPECT') return 'bg-red-100 text-red-700';
    if (type === 'MONTANT_INHABITUEL') return 'bg-yellow-100 text-yellow-700';
    if (type === 'DEPENSE_ANORMALE') return 'bg-orange-100 text-orange-700';
    return 'bg-gray-100 text-gray-600';
  }

  formatType(type: string): string {
    const map: Record<string, string> = {
      'MONTANT_INHABITUEL': 'Montant inhabituel',
      'DEPENSE_ANORMALE': 'Depense anormale',
      'DOUBLE_PAIEMENT_SUSPECT': 'Double paiement suspect',
      'FREQUENCE_ANORMALE': 'Frequence anormale',
    };
    return map[type] ?? type;
  }

}
