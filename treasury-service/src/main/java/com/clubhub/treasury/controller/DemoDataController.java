package com.clubhub.treasury.controller;

import com.clubhub.treasury.entity.*;
import com.clubhub.treasury.repository.*;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/demo")
public class DemoDataController {

    private final CotisationRuleRepository cotisationRuleRepo;
    private final PaymentRepository paymentRepo;
    private final ExpenseRepository expenseRepo;
    private final BudgetRepository budgetRepo;
    private final AuditLogRepository auditLogRepo;
    private final UserRepository userRepo;

    public DemoDataController(CotisationRuleRepository cotisationRuleRepo,
                               PaymentRepository paymentRepo,
                               ExpenseRepository expenseRepo,
                               BudgetRepository budgetRepo,
                               AuditLogRepository auditLogRepo,
                               UserRepository userRepo) {
        this.cotisationRuleRepo = cotisationRuleRepo;
        this.paymentRepo = paymentRepo;
        this.expenseRepo = expenseRepo;
        this.budgetRepo = budgetRepo;
        this.auditLogRepo = auditLogRepo;
        this.userRepo = userRepo;
    }

    @PostMapping("/seed")
    @Transactional
    public ResponseEntity<Map<String, Object>> seed() {
        // Vider les collections avant de reseed (evite les doublons)
        userRepo.deleteAll();
        cotisationRuleRepo.deleteAll();
        paymentRepo.deleteAll();
        expenseRepo.deleteAll();
        budgetRepo.deleteAll();
        auditLogRepo.deleteAll();

        // Users en BDD (MongoDB generates String IDs)
        User president = userRepo.save(User.builder().email("ali.bensalah@esprit.tn").firstName("Ali").lastName("Ben Salah").role(User.UserRole.PRESIDENT).clubId(1L).build());
        User tresorier = userRepo.save(User.builder().email("fatma.haddad@esprit.tn").firstName("Fatma").lastName("Haddad").role(User.UserRole.TRESORIER).clubId(1L).build());
        User bureau = userRepo.save(User.builder().email("hedi.saidi@esprit.tn").firstName("Hedi").lastName("Saidi").role(User.UserRole.MEMBRE_BUREAU).clubId(1L).build());
        User sana = userRepo.save(User.builder().email("sana.khelifi@esprit.tn").firstName("Sana").lastName("Khelifi").role(User.UserRole.MEMBRE).clubId(1L).build());
        User omar = userRepo.save(User.builder().email("omar.mansouri@esprit.tn").firstName("Omar").lastName("Mansouri").role(User.UserRole.MEMBRE).clubId(1L).build());
        User nour = userRepo.save(User.builder().email("nour.triki@esprit.tn").firstName("Nour").lastName("Triki").role(User.UserRole.MEMBRE).clubId(1L).build());
        User yassine = userRepo.save(User.builder().email("yassine.bouazizi@esprit.tn").firstName("Yassine").lastName("Bouazizi").role(User.UserRole.MEMBRE).clubId(1L).build());
        User amira = userRepo.save(User.builder().email("amira.gharbi@esprit.tn").firstName("Amira").lastName("Gharbi").role(User.UserRole.MEMBRE).clubId(1L).build());

        // Cotisation rules
        CotisationRule annual = cotisationRuleRepo.save(CotisationRule.builder()
                .clubId(1L).name("Cotisation annuelle 2025/2026").amount(new BigDecimal("120.000"))
                .frequency(CotisationRule.Frequency.ANNUAL).startDate(LocalDate.of(2025, 9, 1))
                .endDate(LocalDate.of(2026, 8, 31)).active(true)
                .allowExemption(false).allowInstallments(true).maxInstallments(3).build());

        CotisationRule monthly = cotisationRuleRepo.save(CotisationRule.builder()
                .clubId(1L).name("Cotisation mensuelle activites").amount(new BigDecimal("15.000"))
                .frequency(CotisationRule.Frequency.MONTHLY).startDate(LocalDate.of(2025, 10, 1))
                .active(true).allowExemption(true).allowInstallments(false).build());

        // Payments - use actual MongoDB user IDs as memberId
        // Paid payments (with dates spread across months for dashboard chart)
        paymentRepo.save(Payment.builder().memberId(president.getId()).clubId(1L).cotisationRuleId(annual.getId()).amount(new BigDecimal("120.000"))
                .status(Payment.PaymentStatus.PAID).dueDate(LocalDate.of(2025, 10, 1))
                .paidAt(LocalDateTime.of(2025, 10, 3, 10, 30)).build());
        paymentRepo.save(Payment.builder().memberId(tresorier.getId()).clubId(1L).cotisationRuleId(monthly.getId()).amount(new BigDecimal("15.000"))
                .status(Payment.PaymentStatus.PAID).dueDate(LocalDate.of(2025, 11, 1))
                .paidAt(LocalDateTime.of(2025, 11, 2, 9, 0)).build());
        paymentRepo.save(Payment.builder().memberId(bureau.getId()).clubId(1L).cotisationRuleId(annual.getId()).amount(new BigDecimal("120.000"))
                .status(Payment.PaymentStatus.PAID).dueDate(LocalDate.of(2025, 11, 1))
                .paidAt(LocalDateTime.of(2025, 11, 5, 14, 0)).build());
        paymentRepo.save(Payment.builder().memberId(nour.getId()).clubId(1L).cotisationRuleId(annual.getId()).amount(new BigDecimal("120.000"))
                .status(Payment.PaymentStatus.PAID).dueDate(LocalDate.of(2025, 12, 1))
                .paidAt(LocalDateTime.of(2025, 12, 3, 9, 0)).build());
        paymentRepo.save(Payment.builder().memberId(yassine.getId()).clubId(1L).cotisationRuleId(monthly.getId()).amount(new BigDecimal("15.000"))
                .status(Payment.PaymentStatus.PAID).dueDate(LocalDate.of(2026, 1, 1))
                .paidAt(LocalDateTime.of(2026, 1, 2, 11, 0)).build());
        paymentRepo.save(Payment.builder().memberId(president.getId()).clubId(1L).cotisationRuleId(monthly.getId()).amount(new BigDecimal("15.000"))
                .status(Payment.PaymentStatus.PAID).dueDate(LocalDate.of(2026, 2, 1))
                .paidAt(LocalDateTime.of(2026, 2, 3, 10, 0)).build());
        paymentRepo.save(Payment.builder().memberId(amira.getId()).clubId(1L).cotisationRuleId(annual.getId()).amount(new BigDecimal("120.000"))
                .status(Payment.PaymentStatus.PAID).dueDate(LocalDate.of(2026, 2, 1))
                .paidAt(LocalDateTime.of(2026, 2, 5, 15, 0)).build());
        paymentRepo.save(Payment.builder().memberId(tresorier.getId()).clubId(1L).cotisationRuleId(monthly.getId()).amount(new BigDecimal("15.000"))
                .status(Payment.PaymentStatus.PAID).dueDate(LocalDate.of(2026, 3, 1))
                .paidAt(LocalDateTime.of(2026, 3, 2, 9, 0)).build());

        // Pending/Late payments
        paymentRepo.save(Payment.builder().memberId(sana.getId()).clubId(1L).cotisationRuleId(annual.getId()).amount(new BigDecimal("120.000"))
                .status(Payment.PaymentStatus.PENDING).dueDate(LocalDate.of(2026, 4, 15)).build());
        paymentRepo.save(Payment.builder().memberId(omar.getId()).clubId(1L).cotisationRuleId(annual.getId()).amount(new BigDecimal("120.000"))
                .status(Payment.PaymentStatus.LATE).dueDate(LocalDate.of(2026, 1, 1)).build());
        paymentRepo.save(Payment.builder().memberId(yassine.getId()).clubId(1L).cotisationRuleId(annual.getId()).amount(new BigDecimal("120.000"))
                .status(Payment.PaymentStatus.LATE).dueDate(LocalDate.of(2026, 2, 1)).build());

        // Refunded
        paymentRepo.save(Payment.builder().memberId(nour.getId()).clubId(1L).cotisationRuleId(monthly.getId()).amount(new BigDecimal("15.000"))
                .status(Payment.PaymentStatus.REFUNDED).dueDate(LocalDate.of(2025, 12, 1))
                .paidAt(LocalDateTime.of(2025, 12, 3, 9, 0)).build());

        // Exempt
        paymentRepo.save(Payment.builder().memberId(bureau.getId()).clubId(1L).cotisationRuleId(monthly.getId()).amount(new BigDecimal("15.000"))
                .status(Payment.PaymentStatus.EXEMPT).dueDate(LocalDate.of(2026, 3, 1)).build());

        // Expenses - all workflow statuses
        expenseRepo.save(Expense.builder().clubId(1L).submittedByMemberId(president.getId()).title("Materiel evenement")
                .description("Tables et chaises pour journee portes ouvertes").amount(new BigDecimal("320.000"))
                .status(Expense.ExpenseStatus.SUBMITTED).category(Expense.ExpenseCategory.MATERIEL)
                .categoryConfidenceScore(87).build());
        expenseRepo.save(Expense.builder().clubId(1L).submittedByMemberId(sana.getId()).title("Transport deplacement")
                .description("Location bus pour competition inter-universitaire").amount(new BigDecimal("180.000"))
                .status(Expense.ExpenseStatus.VALIDATED).validatedByTreasurerId(tresorier.getId())
                .category(Expense.ExpenseCategory.TRANSPORT).categoryConfidenceScore(94)
                .validatedAt(LocalDateTime.now().minusDays(2)).build());
        expenseRepo.save(Expense.builder().clubId(1L).submittedByMemberId(omar.getId()).title("Restauration reunion")
                .description("Buffet reunion mensuelle du bureau").amount(new BigDecimal("95.000"))
                .status(Expense.ExpenseStatus.APPROVED).validatedByTreasurerId(tresorier.getId()).approvedByPresidentId(president.getId())
                .category(Expense.ExpenseCategory.RESTAURATION).categoryConfidenceScore(91)
                .categoryValidatedByTreasurer(true)
                .validatedAt(LocalDateTime.now().minusDays(5)).approvedAt(LocalDateTime.now().minusDays(3)).build());
        expenseRepo.save(Expense.builder().clubId(1L).submittedByMemberId(bureau.getId()).title("Impression flyers")
                .description("500 flyers evenement de bienvenue").amount(new BigDecimal("45.000"))
                .status(Expense.ExpenseStatus.REJECTED).rejectionReason("Budget communication depasse")
                .category(Expense.ExpenseCategory.COMMUNICATION).categoryConfidenceScore(96).build());
        expenseRepo.save(Expense.builder().clubId(1L).submittedByMemberId(yassine.getId()).title("Hebergement conference")
                .description("2 nuits hotel pour 3 membres - conference nationale").amount(new BigDecimal("450.000"))
                .status(Expense.ExpenseStatus.SUBMITTED).category(Expense.ExpenseCategory.HEBERGEMENT)
                .categoryConfidenceScore(89).build());

        // Budgets
        budgetRepo.save(Budget.builder().clubId(1L).label("Budget annuel 2025/2026")
                .totalAmount(new BigDecimal("5000.000")).consumedAmount(new BigDecimal("3100.000"))
                .periodStart(LocalDate.of(2025, 9, 1)).periodEnd(LocalDate.of(2026, 8, 31))
                .alert50Sent(true).alert75Sent(false).alert90Sent(false).alert100Sent(false).build());
        budgetRepo.save(Budget.builder().clubId(1L).label("Budget evenements S2")
                .totalAmount(new BigDecimal("1500.000")).consumedAmount(new BigDecimal("1380.000"))
                .periodStart(LocalDate.of(2026, 2, 1)).periodEnd(LocalDate.of(2026, 6, 30))
                .alert50Sent(true).alert75Sent(true).alert90Sent(true).alert100Sent(false).build());
        budgetRepo.save(Budget.builder().clubId(1L).label("Budget communication")
                .totalAmount(new BigDecimal("800.000")).consumedAmount(new BigDecimal("350.000"))
                .periodStart(LocalDate.of(2025, 9, 1)).periodEnd(LocalDate.of(2026, 8, 31))
                .alert50Sent(false).alert75Sent(false).alert90Sent(false).alert100Sent(false).build());

        // Audit logs (actorId and entityId are now String)
        auditLogRepo.save(AuditLog.builder().actorId(tresorier.getId()).actorEmail("tresorier@clubhub.tn").clubId(1L)
                .action(AuditLog.ActionType.PAYMENT_CREATED).entityType("Payment").entityId("seed-payment-1")
                .valuesAfter("{\"memberId\":\"" + president.getId() + "\",\"amount\":120}").amount(new BigDecimal("120.000")).build());
        auditLogRepo.save(AuditLog.builder().actorId(tresorier.getId()).actorEmail("tresorier@clubhub.tn").clubId(1L)
                .action(AuditLog.ActionType.EXPENSE_VALIDATED).entityType("Expense").entityId("seed-expense-2")
                .valuesBefore("{\"status\":\"SUBMITTED\"}").valuesAfter("{\"status\":\"VALIDATED\"}")
                .amount(new BigDecimal("180.000")).build());
        auditLogRepo.save(AuditLog.builder().actorId(president.getId()).actorEmail("president@clubhub.tn").clubId(1L)
                .action(AuditLog.ActionType.EXPENSE_APPROVED).entityType("Expense").entityId("seed-expense-3")
                .valuesBefore("{\"status\":\"VALIDATED\"}").valuesAfter("{\"status\":\"APPROVED\"}")
                .amount(new BigDecimal("95.000")).build());
        auditLogRepo.save(AuditLog.builder().actorId(president.getId()).actorEmail("president@clubhub.tn").clubId(1L)
                .action(AuditLog.ActionType.BUDGET_CREATED).entityType("Budget").entityId("seed-budget-1")
                .valuesAfter("{\"label\":\"Budget annuel\",\"total\":5000}").build());

        return ResponseEntity.ok(Map.of(
                "status", "OK",
                "users", userRepo.count(),
                "rules", cotisationRuleRepo.count(),
                "payments", paymentRepo.count(),
                "expenses", expenseRepo.count(),
                "budgets", budgetRepo.count(),
                "auditLogs", auditLogRepo.count()
        ));
    }
}
