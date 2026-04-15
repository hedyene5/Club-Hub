package com.clubhub.treasury.service;

import com.clubhub.treasury.entity.*;
import com.clubhub.treasury.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * RAG (Retrieval-Augmented Generation) Service
 *
 * 1. Detecte l'intention de la question utilisateur
 * 2. Recupere les donnees pertinentes depuis la BDD
 * 3. Construit un contexte riche pour Gemini
 * 4. Gemini genere une reponse informee par les vraies donnees
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RagService {

    private final PaymentRepository paymentRepo;
    private final ExpenseRepository expenseRepo;
    private final BudgetRepository budgetRepo;
    private final CotisationRuleRepository ruleRepo;
    private final AuditLogRepository auditRepo;
    private final UserRepository userRepo;
    private final NotificationRepository notifRepo;
    private final GeminiService geminiService;

    /**
     * Point d'entree RAG : question -> retrieval -> augmented prompt -> generation
     */
    public String askWithRag(Long clubId, String question) {
        // 1. Detecter les intentions
        Set<Intent> intents = detectIntents(question);
        log.info("[RAG] Question: '{}' -> Intents: {}", question, intents);

        // 2. Retriever les donnees pertinentes
        String retrievedContext = retrieveContext(clubId, intents);
        log.debug("[RAG] Context retrieved ({} chars)", retrievedContext.length());

        // 3. Construire le prompt augmente
        String augmentedPrompt = buildAugmentedPrompt(question, retrievedContext);

        // 4. Envoyer a Gemini (passe aussi la question originale pour le fallback)
        return geminiService.askWithFallbackContext(augmentedPrompt, question, retrievedContext);
    }

    // === INTENT DETECTION ===

    enum Intent {
        PAYMENTS, LATE_MEMBERS, RECOVERY_RATE, BUDGET, EXPENSES,
        COTISATION_RULES, MEMBERS, ANOMALIES, PREDICTIONS,
        AUDIT, NOTIFICATIONS, GENERAL_STATS
    }

    private Set<Intent> detectIntents(String question) {
        String q = question.toLowerCase();
        Set<Intent> intents = new HashSet<>();

        // Toujours inclure les stats generales
        intents.add(Intent.GENERAL_STATS);

        if (q.contains("paiement") || q.contains("paye") || q.contains("collecte") || q.contains("recu"))
            intents.add(Intent.PAYMENTS);
        if (q.contains("retard") || q.contains("late") || q.contains("impaye") || q.contains("relance"))
            intents.add(Intent.LATE_MEMBERS);
        if (q.contains("taux") || q.contains("recouvrement") || q.contains("performance"))
            intents.add(Intent.RECOVERY_RATE);
        if (q.contains("budget") || q.contains("consomm") || q.contains("restant") || q.contains("depasse"))
            intents.add(Intent.BUDGET);
        if (q.contains("depense") || q.contains("facture") || q.contains("rembours") || q.contains("approuv"))
            intents.add(Intent.EXPENSES);
        if (q.contains("cotisation") || q.contains("regle") || q.contains("montant") || q.contains("frequence"))
            intents.add(Intent.COTISATION_RULES);
        if (q.contains("membre") || q.contains("utilisateur") || q.contains("inscrit"))
            intents.add(Intent.MEMBERS);
        if (q.contains("anomalie") || q.contains("suspect") || q.contains("fraude") || q.contains("bizarre"))
            intents.add(Intent.ANOMALIES);
        if (q.contains("prevision") || q.contains("prediction") || q.contains("futur") || q.contains("prochain"))
            intents.add(Intent.PREDICTIONS);
        if (q.contains("audit") || q.contains("historique") || q.contains("log") || q.contains("trace"))
            intents.add(Intent.AUDIT);
        if (q.contains("notification") || q.contains("email") || q.contains("alerte"))
            intents.add(Intent.NOTIFICATIONS);

        return intents;
    }

    // === DATA RETRIEVAL ===

    private String retrieveContext(Long clubId, Set<Intent> intents) {
        StringBuilder ctx = new StringBuilder();
        ctx.append("=== DONNEES REELLES DU CLUB (extraites de la base de donnees) ===\n\n");

        if (intents.contains(Intent.GENERAL_STATS)) {
            ctx.append(retrieveGeneralStats(clubId));
        }
        if (intents.contains(Intent.PAYMENTS) || intents.contains(Intent.RECOVERY_RATE)) {
            ctx.append(retrievePayments(clubId));
        }
        if (intents.contains(Intent.LATE_MEMBERS)) {
            ctx.append(retrieveLateMembers(clubId));
        }
        if (intents.contains(Intent.BUDGET)) {
            ctx.append(retrieveBudgets(clubId));
        }
        if (intents.contains(Intent.EXPENSES)) {
            ctx.append(retrieveExpenses(clubId));
        }
        if (intents.contains(Intent.COTISATION_RULES)) {
            ctx.append(retrieveRules(clubId));
        }
        if (intents.contains(Intent.MEMBERS)) {
            ctx.append(retrieveMembers(clubId));
        }
        if (intents.contains(Intent.AUDIT)) {
            ctx.append(retrieveAuditLogs(clubId));
        }
        if (intents.contains(Intent.NOTIFICATIONS)) {
            ctx.append(retrieveNotifications(clubId));
        }

        return ctx.toString();
    }

    private String retrieveGeneralStats(Long clubId) {
        List<Payment> allPayments = paymentRepo.findByClubIdOrderByCreatedAtDesc(clubId);
        BigDecimal totalPaid = allPayments.stream()
                .filter(p -> p.getStatus() == Payment.PaymentStatus.PAID)
                .map(Payment::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalPending = allPayments.stream()
                .filter(p -> p.getStatus() == Payment.PaymentStatus.PENDING)
                .map(Payment::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalLate = allPayments.stream()
                .filter(p -> p.getStatus() == Payment.PaymentStatus.LATE)
                .map(Payment::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        long membersUp = allPayments.stream()
                .filter(p -> p.getStatus() == Payment.PaymentStatus.PAID)
                .map(Payment::getMemberId).distinct().count();
        long membersLate = allPayments.stream()
                .filter(p -> p.getStatus() == Payment.PaymentStatus.LATE)
                .map(Payment::getMemberId).distinct().count();
        long totalUsers = userRepo.findByClubId(clubId).size();
        long totalPayments = allPayments.size();
        long totalExpenses = expenseRepo.findByClubIdOrderByCreatedAtDesc(clubId).size();

        double recoveryRate = 0;
        BigDecimal total = totalPaid.add(totalPending);
        if (total.compareTo(BigDecimal.ZERO) > 0)
            recoveryRate = totalPaid.divide(total, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100)).doubleValue();

        return String.format("""
                [STATISTIQUES GENERALES]
                - Total collecte (paiements confirmes): %s EUR
                - Total en attente: %s EUR
                - Total en retard: %s EUR
                - Taux de recouvrement: %.1f%%
                - Membres a jour: %d / Membres en retard: %d / Total membres: %d
                - Nombre total de paiements: %d
                - Nombre total de depenses: %d

                """, totalPaid, totalPending, totalLate, recoveryRate, membersUp, membersLate, totalUsers, totalPayments, totalExpenses);
    }

    private String retrievePayments(Long clubId) {
        List<Payment> payments = paymentRepo.findByClubIdOrderByCreatedAtDesc(clubId);
        Map<String, Long> byStatus = payments.stream()
                .collect(Collectors.groupingBy(p -> p.getStatus().name(), Collectors.counting()));

        StringBuilder sb = new StringBuilder("[PAIEMENTS - detail par statut]\n");
        byStatus.forEach((status, count) -> sb.append(String.format("- %s: %d paiements\n", status, count)));

        // 5 derniers paiements
        sb.append("\nDerniers paiements:\n");
        payments.stream().limit(5).forEach(p -> sb.append(String.format(
                "  #%s | Membre %s | %s EUR | %s | Echeance: %s | Paye: %s\n",
                p.getId(), p.getMemberId(), p.getAmount(), p.getStatus(),
                p.getDueDate(), p.getPaidAt() != null ? p.getPaidAt().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) : "non")));
        sb.append("\n");
        return sb.toString();
    }

    private String retrieveLateMembers(Long clubId) {
        List<Payment> latePayments = paymentRepo.findByClubIdAndStatus(clubId, Payment.PaymentStatus.LATE);
        StringBuilder sb = new StringBuilder("[MEMBRES EN RETARD]\n");
        if (latePayments.isEmpty()) {
            sb.append("Aucun membre en retard.\n\n");
        } else {
            sb.append(String.format("%d paiement(s) en retard:\n", latePayments.size()));
            latePayments.forEach(p -> {
                User member = userRepo.findById(p.getMemberId()).orElse(null);
                String name = member != null ? member.getFullName() + " (" + member.getEmail() + ")" : "Membre #" + p.getMemberId();
                sb.append(String.format("  - %s | %s EUR | Echeance depassee: %s\n", name, p.getAmount(), p.getDueDate()));
            });
            sb.append("\n");
        }
        return sb.toString();
    }

    private String retrieveBudgets(Long clubId) {
        List<Budget> budgets = budgetRepo.findByClubId(clubId);
        StringBuilder sb = new StringBuilder("[BUDGETS]\n");
        budgets.forEach(b -> sb.append(String.format(
                "  - '%s' | Total: %s EUR | Consomme: %s EUR (%d%%) | Restant: %s EUR | Periode: %s au %s\n",
                b.getLabel(), b.getTotalAmount(), b.getConsumedAmount(), b.getConsumptionPercentage(),
                b.getRemainingAmount(), b.getPeriodStart(), b.getPeriodEnd())));
        sb.append("\n");
        return sb.toString();
    }

    private String retrieveExpenses(Long clubId) {
        List<Expense> expenses = expenseRepo.findByClubIdOrderByCreatedAtDesc(clubId);
        Map<String, Long> byStatus = expenses.stream()
                .collect(Collectors.groupingBy(e -> e.getStatus().name(), Collectors.counting()));

        StringBuilder sb = new StringBuilder("[DEPENSES]\n");
        byStatus.forEach((status, count) -> sb.append(String.format("- %s: %d depenses\n", status, count)));

        BigDecimal totalApproved = expenses.stream()
                .filter(e -> e.getStatus() == Expense.ExpenseStatus.APPROVED)
                .map(Expense::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        sb.append(String.format("- Total depenses approuvees: %s EUR\n", totalApproved));

        sb.append("\nDernieres depenses:\n");
        expenses.stream().limit(5).forEach(e -> sb.append(String.format(
                "  #%s | '%s' | %s EUR | %s | Categorie: %s (%d%% confiance IA)\n",
                e.getId(), e.getTitle(), e.getAmount(), e.getStatus(),
                e.getCategory() != null ? e.getCategory().name() : "?",
                e.getCategoryConfidenceScore() != null ? e.getCategoryConfidenceScore() : 0)));
        sb.append("\n");
        return sb.toString();
    }

    private String retrieveRules(Long clubId) {
        var rules = ruleRepo.findByClubIdAndActiveTrue(clubId);
        StringBuilder sb = new StringBuilder("[REGLES DE COTISATION ACTIVES]\n");
        rules.forEach(r -> sb.append(String.format(
                "  - '%s' | %s EUR | %s | Debut: %s | Exemption: %s | Echelonnement: %s (%s max)\n",
                r.getName(), r.getAmount(), r.getFrequency(), r.getStartDate(),
                r.isAllowExemption() ? "oui" : "non",
                r.isAllowInstallments() ? "oui" : "non",
                r.getMaxInstallments() != null ? r.getMaxInstallments() : "-")));
        sb.append("\n");
        return sb.toString();
    }

    private String retrieveMembers(Long clubId) {
        List<User> users = userRepo.findByClubId(clubId);
        StringBuilder sb = new StringBuilder("[MEMBRES DU CLUB]\n");
        users.forEach(u -> sb.append(String.format(
                "  - %s (%s) | Role: %s | Email: %s\n",
                u.getFullName(), u.getId(), u.getRole(), u.getEmail())));
        sb.append(String.format("Total: %d membres\n\n", users.size()));
        return sb.toString();
    }

    private String retrieveAuditLogs(Long clubId) {
        var logs = auditRepo.findByClubIdOrderByTimestampDesc(clubId);
        StringBuilder sb = new StringBuilder("[JOURNAL D'AUDIT - 10 dernieres actions]\n");
        logs.stream().limit(10).forEach(l -> sb.append(String.format(
                "  %s | %s | %s #%s | Par: %s | Montant: %s\n",
                l.getTimestamp() != null ? l.getTimestamp().format(DateTimeFormatter.ofPattern("dd/MM HH:mm")) : "?",
                l.getAction(), l.getEntityType(), l.getEntityId(), l.getActorEmail(),
                l.getAmount() != null ? l.getAmount() + " EUR" : "-")));
        sb.append("\n");
        return sb.toString();
    }

    private String retrieveNotifications(Long clubId) {
        var notifs = notifRepo.findByClubIdOrderByCreatedAtDesc(clubId);
        StringBuilder sb = new StringBuilder("[NOTIFICATIONS RECENTES]\n");
        sb.append(String.format("Total: %d notifications | Non lues: %d\n",
                notifs.size(), notifs.stream().filter(n -> !n.isRead()).count()));
        notifs.stream().limit(5).forEach(n -> sb.append(String.format(
                "  - [%s] %s -> %s | Email envoye: %s\n",
                n.getType(), n.getTitle(), n.getRecipientEmail(), n.isEmailSent() ? "oui" : "non")));
        sb.append("\n");
        return sb.toString();
    }

    // === PROMPT AUGMENTATION ===

    private String buildAugmentedPrompt(String question, String context) {
        return """
                Tu es l'assistant tresorerie de ClubHub, une plateforme de gestion de clubs universitaires.
                Devise: EUR (Euro).

                REGLES STRICTES:
                - Reponds UNIQUEMENT en francais, en langage naturel (phrases completes, pas de JSON).
                - Base-toi UNIQUEMENT sur les donnees reelles ci-dessous. Ne fabrique aucun chiffre.
                - Sois concis: 2-4 phrases maximum.
                - Cite les montants exacts en EUR.
                - Ne retourne JAMAIS de JSON, de code, ou de structure technique.
                - Si tu ne sais pas, dis simplement "Je n'ai pas cette information."

                %s

                === QUESTION ===
                %s

                Reponds en francais, en langage naturel (pas de JSON).
                """.formatted(context, question);
    }
}
