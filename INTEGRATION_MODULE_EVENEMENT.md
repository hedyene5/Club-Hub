# ClubHub — Integration Module Tresorerie x Module Evenement

## 1. Schema BDD du Module Tresorerie (mes tables)

### Tables principales

```sql
-- COTISATION_RULES : regles de cotisation (montant, frequence, etc.)
CREATE TABLE cotisation_rules (
    id                  BIGSERIAL PRIMARY KEY,
    club_id             BIGINT NOT NULL,
    name                VARCHAR(255) NOT NULL,
    amount              NUMERIC(10, 3) NOT NULL,       -- en TND (3 decimales = millimes)
    frequency           VARCHAR(20) NOT NULL,           -- MONTHLY, QUARTERLY, ANNUAL
    start_date          DATE NOT NULL,
    end_date            DATE,
    active              BOOLEAN NOT NULL DEFAULT TRUE,
    allow_exemption     BOOLEAN NOT NULL DEFAULT FALSE,
    allow_installments  BOOLEAN NOT NULL DEFAULT FALSE,
    max_installments    INTEGER,
    created_at          TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP NOT NULL DEFAULT NOW()
);

-- PAYMENTS : chaque paiement d'un membre (cotisation ou evenement)
CREATE TABLE payments (
    id                        BIGSERIAL PRIMARY KEY,
    member_id                 BIGINT NOT NULL,           -- FK vers users.id
    club_id                   BIGINT NOT NULL,
    cotisation_rule_id        BIGINT REFERENCES cotisation_rules(id),
    amount                    NUMERIC(10, 3) NOT NULL,
    status                    VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    -- Statuts: PENDING, PAID, LATE, REFUNDED, PARTIALLY_REFUNDED, FAILED, EXEMPT
    due_date                  DATE NOT NULL,
    paid_at                   TIMESTAMP,
    stripe_payment_intent_id  VARCHAR(255),
    stripe_receipt_url        VARCHAR(500),
    installment_number        INTEGER,
    total_installments        INTEGER,
    created_at                TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at                TIMESTAMP NOT NULL DEFAULT NOW()
);

-- EXPENSES : demandes de depense (workflow: SUBMITTED → VALIDATED → APPROVED)
CREATE TABLE expenses (
    id                              BIGSERIAL PRIMARY KEY,
    club_id                         BIGINT NOT NULL,
    submitted_by_member_id          BIGINT NOT NULL,       -- FK vers users.id
    validated_by_treasurer_id       BIGINT,                -- FK vers users.id
    approved_by_president_id        BIGINT,                -- FK vers users.id
    title                           VARCHAR(255) NOT NULL,
    description                     TEXT,
    amount                          NUMERIC(10, 3) NOT NULL,
    status                          VARCHAR(20) NOT NULL DEFAULT 'SUBMITTED',
    -- Statuts: SUBMITTED, VALIDATED, APPROVED, REJECTED, CANCELLED
    category                        VARCHAR(50),
    -- Categories: FOURNITURES, TRANSPORT, HEBERGEMENT, RESTAURATION, MATERIEL, COMMUNICATION, EVENEMENT, AUTRE
    category_confidence_score       INTEGER,               -- 0-100, score IA
    category_validated_by_treasurer BOOLEAN NOT NULL DEFAULT FALSE,
    justificatif_url                VARCHAR(500),
    submitted_at                    TIMESTAMP,
    validated_at                    TIMESTAMP,
    approved_at                     TIMESTAMP,
    rejection_reason                VARCHAR(500),
    created_at                      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at                      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- BUDGETS : budget par periode (suivi consommation + alertes seuils)
CREATE TABLE budgets (
    id               BIGSERIAL PRIMARY KEY,
    club_id          BIGINT NOT NULL,
    label            VARCHAR(255) NOT NULL,
    total_amount     NUMERIC(10, 3) NOT NULL,
    consumed_amount  NUMERIC(10, 3) NOT NULL DEFAULT 0,
    period_start     DATE NOT NULL,
    period_end       DATE NOT NULL,
    alert_50_sent    BOOLEAN NOT NULL DEFAULT FALSE,
    alert_75_sent    BOOLEAN NOT NULL DEFAULT FALSE,
    alert_90_sent    BOOLEAN NOT NULL DEFAULT FALSE,
    alert_100_sent   BOOLEAN NOT NULL DEFAULT FALSE,
    created_at       TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMP NOT NULL DEFAULT NOW()
);

-- USERS : table temporaire (en attendant le vrai module User)
CREATE TABLE users (
    id          BIGSERIAL PRIMARY KEY,
    email       VARCHAR(255) NOT NULL UNIQUE,
    first_name  VARCHAR(100) NOT NULL,
    last_name   VARCHAR(100) NOT NULL,
    role        VARCHAR(30) NOT NULL,  -- PRESIDENT, TRESORIER, MEMBRE_BUREAU, MEMBRE
    club_id     BIGINT NOT NULL,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

-- NOTIFICATIONS : emails et alertes envoyes
CREATE TABLE notifications (
    id              BIGSERIAL PRIMARY KEY,
    club_id         BIGINT NOT NULL,
    recipient_id    BIGINT NOT NULL,
    recipient_email VARCHAR(255) NOT NULL,
    type            VARCHAR(50) NOT NULL,
    title           VARCHAR(255) NOT NULL,
    message         TEXT NOT NULL,
    read            BOOLEAN NOT NULL DEFAULT FALSE,
    email_sent      BOOLEAN NOT NULL DEFAULT FALSE,
    attachment_url  VARCHAR(500),
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- AUDIT_LOGS : journal immuable de toutes les actions
CREATE TABLE audit_logs (
    id            BIGSERIAL PRIMARY KEY,
    actor_id      BIGINT NOT NULL,
    actor_email   VARCHAR(255) NOT NULL,
    club_id       BIGINT NOT NULL,
    action        VARCHAR(50) NOT NULL,
    entity_type   VARCHAR(50) NOT NULL,
    entity_id     BIGINT NOT NULL,
    values_before TEXT,
    values_after  TEXT,
    amount        NUMERIC(10, 3),
    ip_address    VARCHAR(45),
    timestamp     TIMESTAMP NOT NULL DEFAULT NOW()
);

-- RECEIPTS : recus de paiement (PDF genere)
CREATE TABLE receipts (
    id             BIGSERIAL PRIMARY KEY,
    payment_id     BIGINT NOT NULL REFERENCES payments(id),
    receipt_number VARCHAR(50) NOT NULL UNIQUE,
    file_path      VARCHAR(500) NOT NULL,
    member_name    VARCHAR(255) NOT NULL,
    club_name      VARCHAR(255) NOT NULL,
    generated_at   TIMESTAMP NOT NULL DEFAULT NOW()
);
```

---

## 2. API REST du Module Tresorerie (endpoints utiles pour Evenement)

Base URL: `http://localhost:8082/api/v1/treasury/{clubId}`

### Endpoints que le module Evenement peut appeler :

| Methode | URL | Usage pour Evenement |
|---------|-----|----------------------|
| `POST /expenses` | Creer une depense liee a un evenement |
| `GET /expenses?status=APPROVED` | Voir les depenses approuvees pour un evenement |
| `GET /budgets` | Verifier le budget disponible avant de valider un evenement |
| `POST /budgets` | Creer un budget dedie a un evenement |
| `GET /dashboard` | KPIs financiers du club |
| `POST /api/v1/users` | Creer un utilisateur |
| `GET /api/v1/users/club/{clubId}` | Lister les membres du club |

### Exemple : creer une depense pour un evenement
```json
POST /api/v1/treasury/1/expenses
Headers: X-Actor-Id: 5, Content-Type: application/json

{
  "title": "Location salle - Gala annuel",
  "description": "Salle des fetes pour le gala du 15 mai",
  "amount": 500.000,
  "justificatifUrl": "https://..."
}
```

### Exemple : creer un budget dedie a un evenement
```json
POST /api/v1/treasury/1/budgets

{
  "label": "Budget Gala 2026",
  "totalAmount": 2000.000,
  "periodStart": "2026-04-01",
  "periodEnd": "2026-05-31"
}
```

---

## 3. Comment connecter nos 2 modules

### Option A : Appels REST inter-services (recommande)

```
Module Evenement                    Module Tresorerie
     |                                    |
     |--- POST /expenses --------------->| Creer depense pour evenement
     |--- POST /budgets ---------------->| Creer budget dedie
     |--- GET /budgets ----------------->| Verifier budget dispo
     |<-- 200 OK + donnees --------------|
```

Le module Evenement appelle mes endpoints REST quand il a besoin de:
- Creer une depense liee a un evenement
- Verifier qu'il y a du budget
- Consulter les paiements d'inscription

### Option B : Table de liaison (si meme BDD)

Si on partage la meme base PostgreSQL, on peut ajouter une colonne dans `expenses` :

```sql
ALTER TABLE expenses ADD COLUMN event_id BIGINT;
-- FK vers la table events du module Evenement
```

Et dans la table `budgets` :
```sql
ALTER TABLE budgets ADD COLUMN event_id BIGINT;
-- Un budget peut etre lie a un evenement specifique
```

### Option C : Event-driven (avance)

Publier des evenements via un message broker (RabbitMQ/Kafka) :
- Evenement cree → Tresorerie cree automatiquement un budget
- Depense approuvee → Evenement recoit la notification

---

## 4. Ce dont j'ai besoin de ta part (Module Evenement)

Pour que je puisse integrer ton module, envoie-moi :

1. **Ta table `events`** (schema SQL) — pour que j'ajoute `event_id` dans mes tables
2. **Tes endpoints REST** — pour que mon module puisse appeler le tien si besoin
3. **Le port de ton service** — pour la config CORS et les appels inter-services

---

## 5. Stack technique du Module Tresorerie

| Tech | Version |
|------|---------|
| Spring Boot | 3.3.4 |
| Java | 21 |
| Angular | 21 |
| PostgreSQL / H2 | 16 / dev |
| Stripe | SDK 26.3.0 |
| Gemini AI | 1.5 Flash |
| iText PDF | 8.0.5 |
| Port backend | 8082 |
| Port frontend | 4200 |
