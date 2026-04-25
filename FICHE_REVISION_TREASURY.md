# Fiche de révision — Module Treasury (Validation)

Spring Boot 3.3.4 + Java 21 + MongoDB 8.2.6 + Spring Security + JJWT 0.12.6

---

## 1. Structure des packages

```
com.clubhub.treasury
├── config/          # SecurityConfig, OpenApiConfig
├── controller/      # 10 REST controllers (/api/v1/treasury/{clubId}/*)
├── dto/
│   ├── request/     # CreateExpenseRequest, CreateCotisationRuleRequest...
│   └── response/    # BilanResponse, DashboardResponse, ChatResponse...
├── entity/          # 8 @Document MongoDB
├── exception/       # TreasuryException + GlobalExceptionHandler
├── mapper/          # Entity <-> DTO
├── repository/      # 8 MongoRepository
├── security/        # JwtCookieAuthFilter, JwtTokenProvider, Roles, CurrentUser
└── service/         # 16 services (métier + scheduler)
```

---

## 2. Entités MongoDB (8 collections)

| Entité | Collection | Champs clés | Enums |
|--------|------------|-------------|-------|
| **Expense** | `expenses` | clubId, amount, status, category, quotes[3], categoryConfidenceScore | ExpenseStatus (SUBMITTED/VALIDATED/APPROVED/REJECTED/CANCELLED), ExpenseCategory (8 valeurs) |
| **Payment** | `payments` | memberId, clubId, amount, status, dueDate, stripePaymentIntentId, installmentNumber | PaymentStatus (PENDING/PENDING_CASH/PAID/LATE/REFUNDED/PARTIALLY_REFUNDED/FAILED/EXEMPT) |
| **Budget** | `budgets` | clubId, totalAmount, consumedAmount, periodStart/End, alert50/75/90/100Sent | — |
| **CotisationRule** | `cotisation_rules` | clubId, amount, frequency, active, allowInstallments, maxInstallments | Frequency (MONTHLY/QUARTERLY/ANNUAL) |
| **User** | `users` | email(unique), firstName, lastName, role, clubId | UserRole (6+2 legacy) |
| **Receipt** | `receipts` | paymentId, receiptNumber, filePath | — |
| **AuditLog** | `audit_logs` | actorId, action, entityType, entityId, valuesBefore/After, amount | ActionType (~15 valeurs) |
| **Notification** | `notifications` | recipientId, type, title, message, read, emailSent | NotificationType (~12 valeurs) |

### Méthodes calculées importantes
- `Budget.getRemainingAmount()` = totalAmount − consumedAmount
- `Budget.getConsumptionPercentage()` = (consumed / total) × 100
- `User.getFullName()` = firstName + " " + lastName

---

## 3. Repositories (8)

| Repo | Méthodes custom principales |
|------|----------------------------|
| **ExpenseRepository** | findByClubIdOrderByCreatedAtDesc, findByClubIdAndStatus, findBySubmittedByMemberIdAndClubId |
| **PaymentRepository** | findByClubIdAndStatus, findByMemberIdAndClubId, **findByStatusAndDueDateBefore** (détection retards) |
| **BudgetRepository** | findByClubId, findFirstByClubIdAndPeriodStart...GreaterThanEqual... (budget actif) |
| **CotisationRuleRepository** | findByClubIdAndActiveTrue |
| **UserRepository** | findByClubId, findByEmail, findByClubIdAndRole |
| **NotificationRepository** | findByRecipientIdAndReadFalseOrderByCreatedAtDesc, countByRecipientIdAndReadFalse |
| **ReceiptRepository** | findByPaymentId, findByReceiptNumber |
| **AuditLogRepository** | findByClubIdOrderByTimestampDesc |

Tous étendent `MongoRepository<Entity, String>`.

---

## 4. Services (16) — Logique métier

### Services cœur

| Service | Responsabilité |
|---------|---------------|
| **ExpenseService** | Workflow dépenses : submit → validate (N1 trésorier) → approve (N2 président). Valide 3 devis. Auto-catégorisation Gemini. MAJ budget à l'APPROVED. |
| **PaymentService** | Gestion PaymentStatus, confirmation Stripe, marquage LATE automatique, remboursements |
| **CotisationService** | Création règles + génération Payment en masse (support échelonnement multi-mois) |
| **BudgetService** | CRUD budget (MAJ consommation faite par ExpenseService) |
| **BilanService** | Bilans financiers + export PDF iText7 (bilan période, facture dépense) |
| **DashboardService** | Agrégation KPIs (collecté, attente, retard, taux recouvrement, budget %) |
| **AnomalyDetectionService** | Détection Z-score > 2.0 sur paiements/dépenses + doublons |
| **NotificationService** | In-app + email JavaMailSender, helpers notify{Expense/Payment/Budget}* |
| **NotificationScheduler** | 3 @Scheduled (voir §7) |
| **AuditService** | Log immuable des actions sensibles |
| **ReceiptService** | Génération reçus PDF (iText7) |
| **StripeService** | PaymentIntent + Checkout Session + refund |
| **GeminiService** | API Gemini 2.0-flash (catégorisation, chat, prédictions) |
| **PredictionService** | Prédictions budgétaires N mois (linéaire ou Gemini) |
| **RagService** | Chatbot RAG : détection intent → retrieval BDD → prompt augmenté |
| **UserContextService** | Résolution users pour enrichissement noms |

---

## 5. Controllers (10) — Routes REST

Tous sous `/api/v1/treasury/{clubId}/*` sauf DemoDataController et UserController.

| Controller | Path | Endpoints principaux |
|-----------|------|---------------------|
| **ExpenseController** | /expenses | GET, POST (submit), PATCH /{id}/validate, /approve, /reject |
| **PaymentController** | /payments | GET (liste/filtre), GET /member/{id}, PATCH /{id}/request-cash, /{id}/confirm |
| **CotisationController** | /cotisations | GET /rules, POST /rules, POST /rules/{id}/assign |
| **BudgetController** | /budgets | GET, POST |
| **BilanController** | /bilans | GET, /trimestre, /semestre, /annuel, /pdf, /facture/{expenseId} |
| **DashboardController** | /dashboard | GET |
| **NotificationController** | /notifications | GET, /user/{id}, /user/{id}/unread, /user/{id}/count, PATCH /{id}/read, /user/{id}/read-all |
| **StripeController** | /stripe | POST /create-payment-intent/{id}, /checkout-session/{id}, GET /session/{id}, /status |
| **AuditController** | /audit | GET |
| **AiController** | /ai | POST /chat (RAG), GET /predictions, /anomalies, POST /categorize |
| **DemoDataController** | /api/v1/demo | POST /seed (public) |
| **UserController** | /api/v1/users | CRUD users + /club/{clubId}, /mock-login (public dev) |

---

## 6. Sécurité — JWT Cookie Flow

### Flow d'authentification (5 étapes)
```
1. User login (module User port 8081) → émet JWT (secret partagé)
2. Cookie 'jwt' httpOnly SameSite=Lax posé sur la réponse
3. Requête Treasury : navigateur ré-envoie cookie (withCredentials: true)
4. JwtCookieAuthFilter extrait + valide JWT (HMAC-SHA256)
5. SecurityContext peuplé → Controllers utilisent @PreAuthorize
```

### Classes clés
- **JwtCookieAuthFilter** : `OncePerRequestFilter`, lit cookie 'jwt' OU header Authorization
- **JwtTokenProvider** : parse claims `sub` (email), `userId`, `role`
- **CurrentUser** : helper statique `email() / userId() / role() / hasRole()`
- **Roles** : constantes SpEL pour @PreAuthorize

### Expressions @PreAuthorize (Roles.java)
| Constante | Équivalent |
|-----------|-----------|
| `TRESORIER_ONLY` | hasRole('TRESORIER') |
| `BUREAU_OR_TRESORIER` | hasAnyRole('TRESORIER','PRESIDENT','VICE_PRESIDENT','SECRETAIRE_GENERALE') |
| `READ_REPORTS` | Bureau + RH |
| `APPROVE_EXPENSES` | PRESIDENT / VICE_PRESIDENT / SECRETAIRE_GENERALE |
| `MEMBRE_ONLY` | hasRole('MEMBRE_SIMPLE') |
| `AUTHENTICATED` | isAuthenticated() |

### Routes publiques (SecurityConfig)
- `/h2-console/**`, `/swagger-ui/**`, `/api-docs/**`, `/v3/api-docs/**`
- `/actuator/health`, `/error`
- `/api/v1/demo/**` (seed)
- `/api/v1/users/mock-login` (dev uniquement)

---

## 7. Schedulers (NotificationScheduler)

| Cron | Heure | Méthode | Effet |
|------|-------|---------|-------|
| `0 0 8 * * *` | **08h00 tous les jours** | `markOverduePayments()` | Payment PENDING + dueDate < today → **LATE** + notification retard |
| `0 0 9 * * *` | **09h00 tous les jours** | `sendPaymentReminders()` | Rappels **J-7, J-3, J-0** pour PENDING |
| `0 0 10 * * *` | **10h00 tous les jours** | `checkBudgetAlerts()` | Vérifie seuils **50 / 75 / 90 / 100 %** → alertes (flag `alertXXSent` évite doublon) |

**Rappel** : `notification.email-enabled: false` en dev → les schedulers créent les notifs in-app mais n'envoient pas d'emails (sauf `sendDirectEmail()` qui bypasse).

---

## 8. RÈGLES MÉTIER CRITIQUES (à maîtriser absolument)

### ① Système 3 devis — Expense
- **Classe** : `Expense.Quote` (nested : providerName, amount, description, selected)
- **Validation** : `CreateExpenseRequest.quotes` avec `@Size(min=3, max=3)` (obligatoire)
- **Workflow** : Membre soumet 3 devis → Trésorier en sélectionne 1 → `expense.amount` = montant du devis sélectionné
- **Demande du prof** (ajouté le 14/04)

### ② Workflow Validation N1 / N2 — Expense
```
Membre          Trésorier         Président/VP/SG
  |                 |                    |
  v                 v                    v
SUBMITTED -----> VALIDATED --------> APPROVED
  |                 |                    |
  +----- reject ----+--- reject ---------+
                    v
                REJECTED (+ reason)
```
- **N1 (TRESORIER_ONLY)** : PATCH `/expenses/{id}/validate?selectedQuoteIndex=X`
- **N2 (APPROVE_EXPENSES)** : PATCH `/expenses/{id}/approve` → MAJ budget consommé

### ③ Cotisations échelonnées
- Si `CotisationRule.allowInstallments=true` → N Payments créés (N = maxInstallments)
- Montant par échéance = `amount / maxInstallments` (BigDecimal, 3 décimales, HALF_UP)
- `dueDate` = startDate + i mois (i de 0 à N-1)
- Champs Payment : `installmentNumber`, `totalInstallments`

### ④ Marquage retards automatique
- **Cron 08h** : `PaymentService.markOverdueAsLate()`
- **Query** : `findByStatusAndDueDateBefore(PENDING, today)` → toutes marquées LATE
- **Notification** : 1 notif par membre en retard

### ⑤ MAJ budget consommé
- Déclenché par `ExpenseService.approve()` (pas à la soumission !)
- `budget.consumedAmount += expense.amount`
- Budget actif = `periodStart ≤ today ≤ periodEnd`
- Après MAJ, scheduler 10h vérifie seuils

### ⑥ Taux de recouvrement (Dashboard + Bilan)
```
recoveryRate = totalPaid / (totalPaid + totalPending + totalLate) × 100
```
- % de cotisations effectivement collectées

### ⑦ Auto-catégorisation Gemini
- `ExpenseService.submit()` appelle `geminiService.categorizeExpense(title, description)`
- Réponse JSON : `{ "category": "FOURNITURES", "confidence": 85 }`
- Fallback : category=AUTRE, confidence=0 si Gemini HS (quota 429)
- Trésorier peut corriger : flag `categoryValidatedByTreasurer`

### ⑧ Détection anomalies (Z-score)
- **Formule** : `Z = |montant - moyenne| / écart-type`
- **Seuil** : Z > 2.0 → anomalie détectée
- **3 types** :
  - MONTANT_INHABITUEL (Payment avec Z-score élevé)
  - DEPENSE_ANORMALE (Expense avec Z-score élevé)
  - DOUBLON_SUSPECT (même montant + même date)
- **Confidence** : `min(99, 50 + zScore × 20)`

### ⑨ Paiement espèces (workflow trésorier-membre)
```
Membre  ----request-cash---->  PENDING_CASH
                                     |
Trésorier  ----confirm--->          PAID
                                     |
                              notification + reçu PDF
```

### ⑩ PaymentStatus — tous les états
`PENDING → (stripe) PAID`
`PENDING → (request-cash) PENDING_CASH → (confirm) PAID`
`PENDING → (scheduler 08h, dueDate dépassée) LATE`
`PAID → (refund) REFUNDED` ou `PARTIALLY_REFUNDED`
`* → FAILED` (stripe KO) ou `EXEMPT` (bourse)

---

## 9. Points techniques à retenir

### Gestion des montants
- **BigDecimal** partout (jamais float/double)
- Divisions : `divide(N, 3, RoundingMode.HALF_UP)`
- Comparaisons : `.compareTo(BigDecimal.ZERO)` (pas `==`)

### Transactions
- `@Transactional` sur méthodes services modifiant plusieurs entités
- Rollback auto sur `TreasuryException` et `RuntimeException`

### Gestion d'erreurs
```java
throw new TreasuryException("Message utilisateur", HttpStatus.BAD_REQUEST.value());
```
- **GlobalExceptionHandler** (`@RestControllerAdvice`) :
  - `AccessDeniedException` → 403 (pas 500)
  - `TreasuryException` → ex.getStatus()
  - `MethodArgumentNotValidException` → 400 + field errors
  - `RuntimeException` → 500

### MongoDB — indexation
- `@Indexed` sur : clubId (toutes entités), memberId, status, recipientId
- `@Indexed(unique=true)` sur User.email

### PDF (iText 7/8)
- Bilan : N&B, 5 sections (Recettes, Dépenses, Résultat, Budget, Récapitulatif), devise TND
- Reçu paiement : couleurs marque (#1C2340 dark, #E84068 accent), numéro unique
- Facture dépense : TVA 20%, TND

### Configuration
- **JWT secret** (partagé User/Treasury) : `clubhub_super_secret_key_must_be_at_least_32_chars!`
- **JWT expiration** : 86400000 ms (24h)
- **Cookie name** : `jwt`
- **Stripe** : devise TND (compte FR peut refuser)
- **Gemini** : model `gemini-2.0-flash`

---

## 10. Questions-types de validation (préparation)

1. **Explique le workflow complet d'une dépense de la soumission à l'approbation.**
   → SUBMITTED (membre + 3 devis) → VALIDATED (trésorier sélectionne 1 devis) → APPROVED (président, MAJ budget)

2. **Comment un paiement en retard est-il détecté ?**
   → `NotificationScheduler.markOverduePayments()` cron 08h, query `findByStatusAndDueDateBefore(PENDING, today)`

3. **Comment le JWT est-il transmis entre User-service et Treasury ?**
   → Cookie httpOnly 'jwt', secret HMAC-SHA256 partagé, `JwtCookieAuthFilter` extrait + valide

4. **Quelle est la règle des 3 devis ?**
   → `@Size(min=3, max=3)` sur `List<QuoteRequest> quotes`, trésorier sélectionne `selectedQuoteIndex`, montant expense = montant devis retenu

5. **Comment détecte-t-on une anomalie de paiement ?**
   → Z-score > 2.0 sur distribution des montants, OU doublon (même montant + même date)

6. **Comment est calculé le taux de recouvrement ?**
   → `totalPaid / (totalPaid + totalPending + totalLate) × 100`

7. **Quels sont les 3 schedulers ?**
   → 08h retards, 09h rappels J-7/J-3/J-0, 10h alertes budget 50/75/90/100%

8. **Comment l'IA catégorise une dépense ?**
   → `GeminiService.categorizeExpense(title, description)` → JSON `{category, confidence}`, fallback AUTRE si KO

9. **Explique la gestion des cotisations échelonnées.**
   → `allowInstallments=true` + `maxInstallments=N` → N Payment, montant/N, dueDate échelonnée de N mois

10. **Quelle est la différence entre @PreAuthorize(Roles.TRESORIER_ONLY) et @PreAuthorize(Roles.BUREAU_OR_TRESORIER) ?**
    → `TRESORIER_ONLY` = 1 rôle, `BUREAU_OR_TRESORIER` = 4 rôles (trésorier + bureau)

---

**Stratégie 30 min de révision** :
- §2 Entités (5 min) — surtout les enums et relations
- §4 Services cœur (5 min) — ExpenseService + PaymentService + NotificationScheduler
- §7 Schedulers (2 min) — les 3 crons par cœur
- §8 Règles métier (10 min) — LE plus important
- §10 Questions-types (8 min) — simuler l'oral

Bon courage pour la validation !
