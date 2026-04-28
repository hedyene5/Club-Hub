import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { apiUrl } from '../../../environments/environment';            // <-- import
import {
  CotisationRule, Payment, Expense, Budget,
  TreasuryDashboard, AnomalyAlert, BudgetPrediction,
  ChatMessage, AuditLog
} from '../models/treasury.models';

export interface LatePaymentPrediction {
  memberId: string;
  memberName: string;
  email: string;
  role: string;
  lateProbability: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'UNKNOWN';
  previousPayments: number;
  previousLate: number;
}

@Injectable({ providedIn: 'root' })
export class TreasuryApiService {

  // All treasury endpoints now go through the Gateway
  private base      = apiUrl('/api/v1/treasury');
  private demoBase  = apiUrl('/api/v1/demo');            // for demo seed & predictions

  constructor(private http: HttpClient) {}

  // Dashboard
  getDashboard(clubId: number): Observable<TreasuryDashboard> {
    return this.http.get<TreasuryDashboard>(`${this.base}/${clubId}/dashboard`);
  }

  // Cotisations
  getCotisationRules(clubId: number): Observable<CotisationRule[]> {
    return this.http.get<CotisationRule[]>(`${this.base}/${clubId}/cotisations/rules`);
  }
  createCotisationRule(clubId: number, rule: Partial<CotisationRule>): Observable<CotisationRule> {
    return this.http.post<CotisationRule>(`${this.base}/${clubId}/cotisations/rules`, rule);
  }

  // Payments
  getPayments(clubId: number): Observable<Payment[]> {
    return this.http.get<Payment[]>(`${this.base}/${clubId}/payments`);
  }

  // Expenses
  getExpenses(clubId: number, status?: string): Observable<Expense[]> {
    const params = status ? `?status=${status}` : '';
    return this.http.get<Expense[]>(`${this.base}/${clubId}/expenses${params}`);
  }
  submitExpense(clubId: number, expense: Partial<Expense>): Observable<Expense> {
    return this.http.post<Expense>(`${this.base}/${clubId}/expenses`, expense);
  }
  validateExpense(clubId: number, expenseId: string, selectedQuoteIndex: number = 0): Observable<Expense> {
    return this.http.patch<Expense>(`${this.base}/${clubId}/expenses/${expenseId}/validate`, { selectedQuoteIndex });
  }
  approveExpense(clubId: number, expenseId: string): Observable<Expense> {
    return this.http.patch<Expense>(`${this.base}/${clubId}/expenses/${expenseId}/approve`, {});
  }
  rejectExpense(clubId: number, expenseId: string, reason: string): Observable<Expense> {
    return this.http.patch<Expense>(`${this.base}/${clubId}/expenses/${expenseId}/reject`, { reason });
  }

  // Budget
  getBudgets(clubId: number): Observable<Budget[]> {
    return this.http.get<Budget[]>(`${this.base}/${clubId}/budgets`);
  }
  createBudget(clubId: number, budget: Partial<Budget>): Observable<Budget> {
    return this.http.post<Budget>(`${this.base}/${clubId}/budgets`, budget);
  }

  // Audit
  getAuditLogs(clubId: number): Observable<AuditLog[]> {
    return this.http.get<AuditLog[]>(`${this.base}/${clubId}/audit`);
  }

  // Receipts
  generateReceipt(clubId: number, paymentId: string, memberName: string, clubName: string): Observable<any> {
    return this.http.post(`${this.base}/${clubId}/receipts/generate/${paymentId}?memberName=${encodeURIComponent(memberName)}&clubName=${encodeURIComponent(clubName)}`, {});
  }
  downloadReceipt(clubId: number, paymentId: string, memberName: string, clubName: string): Observable<Blob> {
    return this.http.get(`${this.base}/${clubId}/receipts/download/${paymentId}?memberName=${encodeURIComponent(memberName)}&clubName=${encodeURIComponent(clubName)}`, { responseType: 'blob' });
  }

  // IA - Chatbot
  chatAi(clubId: number, message: string): Observable<{ reply: string; source: string }> {
    return this.http.post<{ reply: string; source: string }>(`${this.base}/${clubId}/ai/chat`, { message });
  }

  // IA - Predictions
  getPredictions(clubId: number, months: number = 3): Observable<BudgetPrediction[]> {
    return this.http.get<BudgetPrediction[]>(`${this.base}/${clubId}/ai/predictions?months=${months}`);
  }

  // IA - Anomalies
  getAnomalies(clubId: number): Observable<AnomalyAlert[]> {
    return this.http.get<AnomalyAlert[]>(`${this.base}/${clubId}/ai/anomalies`);
  }

  // IA - Categorisation
  categorizeExpense(clubId: number, title: string, description: string): Observable<{ category: string; confidence: number; reason: string; source: string }> {
    return this.http.post<{ category: string; confidence: number; reason: string; source: string }>(`${this.base}/${clubId}/ai/categorize`, { title, description });
  }

  // IA - Status
  getAiStatus(clubId: number): Observable<{ geminiAvailable: boolean; model: string; features: string[] }> {
    return this.http.get<{ geminiAvailable: boolean; model: string; features: string[] }>(`${this.base}/${clubId}/ai/status`);
  }

  // Late payment predictions (public demo endpoint – now through gateway)
  getLatePaymentPredictions(): Observable<LatePaymentPrediction[]> {
    return this.http.get<LatePaymentPrediction[]>(`${this.demoBase}/late-payment/predictions`);
  }

  // Stripe
  createPaymentIntent(clubId: number, paymentId: string, memberName: string): Observable<{ clientSecret: string; paymentIntentId: string; mode: string }> {
    return this.http.post<{ clientSecret: string; paymentIntentId: string; mode: string }>(`${this.base}/${clubId}/stripe/create-payment-intent/${paymentId}?memberName=${encodeURIComponent(memberName)}`, {});
  }

  createCheckoutSession(clubId: number, paymentId: string, memberName: string): Observable<{ sessionId: string; url: string; mode: string }> {
    const successUrl = encodeURIComponent(window.location.origin + '/treasury/payer-cotisation');
    const cancelUrl = encodeURIComponent(window.location.origin + '/treasury/payer-cotisation?cancelled=true');
    return this.http.post<{ sessionId: string; url: string; mode: string }>(
        `${this.base}/${clubId}/stripe/checkout-session/${paymentId}?memberName=${encodeURIComponent(memberName)}&successUrl=${successUrl}&cancelUrl=${cancelUrl}`, {});
  }

  getStripeSession(clubId: number, sessionId: string): Observable<{ paymentIntentId: string; status: string }> {
    return this.http.get<{ paymentIntentId: string; status: string }>(`${this.base}/${clubId}/stripe/session/${sessionId}`);
  }

  confirmPayment(clubId: number, paymentId: string, stripeIntentId: string, receiptUrl: string, clubName: string, memberName?: string): Observable<any> {
    return this.http.patch(`${this.base}/${clubId}/payments/${paymentId}/confirm`,
        { stripeIntentId, receiptUrl, clubName, memberName: memberName || 'Membre' });
  }

  requestCashPayment(clubId: number, paymentId: string): Observable<any> {
    return this.http.patch(`${this.base}/${clubId}/payments/${paymentId}/request-cash`, {});
  }

  getMyPayments(clubId: number, memberId: string): Observable<Payment[]> {
    return this.http.get<Payment[]>(`${this.base}/${clubId}/payments/member/${memberId}`);
  }

  refundPayment(clubId: number, paymentId: string, actorId: string, actorEmail: string): Observable<any> {
    return this.http.patch(`${this.base}/${clubId}/payments/${paymentId}/refund`, {},
        { headers: { 'X-Actor-Id': actorId, 'X-Actor-Email': actorEmail } });
  }

  // Demo seed (now through gateway)
  seedDemoData(): Observable<any> {
    return this.http.post(`${this.demoBase}/seed`, {});
  }
}