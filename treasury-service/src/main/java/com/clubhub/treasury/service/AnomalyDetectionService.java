package com.clubhub.treasury.service;

import com.clubhub.treasury.dto.response.AnomalyResponse;
import com.clubhub.treasury.entity.Expense;
import com.clubhub.treasury.entity.Payment;
import com.clubhub.treasury.repository.ExpenseRepository;
import com.clubhub.treasury.repository.PaymentRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.MathContext;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AnomalyDetectionService {

    private final PaymentRepository paymentRepository;
    private final ExpenseRepository expenseRepository;
    private final MlAnomalyDetectionService mlService;

    public AnomalyDetectionService(PaymentRepository paymentRepository,
                                    ExpenseRepository expenseRepository,
                                    MlAnomalyDetectionService mlService) {
        this.paymentRepository = paymentRepository;
        this.expenseRepository = expenseRepository;
        this.mlService = mlService;
    }

    public List<AnomalyResponse> detectAnomalies(Long clubId) {
        List<AnomalyResponse> anomalies = new ArrayList<>();

        anomalies.addAll(detectPaymentAnomalies(clubId));

        // Prefer ML (Isolation Forest) for expenses; fallback to Z-Score if model not trained
        List<AnomalyResponse> mlAnomalies = mlService.detectAnomalies(clubId);
        if (!mlAnomalies.isEmpty()) {
            anomalies.addAll(mlAnomalies);
        } else {
            anomalies.addAll(detectExpenseAnomalies(clubId));
        }

        anomalies.addAll(detectDuplicatePayments(clubId));

        anomalies.sort(Comparator.comparingInt(AnomalyResponse::getConfidenceScore).reversed());
        return anomalies;
    }

    private List<AnomalyResponse> detectPaymentAnomalies(Long clubId) {
        List<Payment> payments = paymentRepository.findByClubIdOrderByCreatedAtDesc(clubId);
        List<AnomalyResponse> anomalies = new ArrayList<>();

        if (payments.size() < 3) return anomalies;

        List<BigDecimal> amounts = payments.stream()
                .map(Payment::getAmount)
                .collect(Collectors.toList());

        BigDecimal mean = mean(amounts);
        BigDecimal stddev = stddev(amounts, mean);

        if (stddev.compareTo(BigDecimal.ZERO) == 0) return anomalies;

        for (Payment p : payments) {
            BigDecimal zScore = p.getAmount().subtract(mean)
                    .divide(stddev, 4, RoundingMode.HALF_UP).abs();

            if (zScore.compareTo(new BigDecimal("2.0")) > 0) {
                int confidence = Math.min(99, 50 + zScore.intValue() * 20);
                anomalies.add(AnomalyResponse.builder()
                        .paymentId(p.getId())
                        .type("MONTANT_INHABITUEL")
                        .description("Paiement de " + p.getAmount() + " TND - Z-Score: " + zScore.setScale(2, RoundingMode.HALF_UP)
                                + " (moyenne: " + mean.setScale(2, RoundingMode.HALF_UP) + " TND)")
                        .confidenceScore(confidence)
                        .zScore(zScore.doubleValue())
                        .detectedAt(LocalDateTime.now())
                        .build());
            }
        }

        return anomalies;
    }

    private List<AnomalyResponse> detectExpenseAnomalies(Long clubId) {
        List<Expense> expenses = expenseRepository.findByClubIdOrderByCreatedAtDesc(clubId);
        List<AnomalyResponse> anomalies = new ArrayList<>();

        if (expenses.size() < 3) return anomalies;

        List<BigDecimal> amounts = expenses.stream()
                .map(Expense::getAmount)
                .collect(Collectors.toList());

        BigDecimal mean = mean(amounts);
        BigDecimal stddev = stddev(amounts, mean);

        if (stddev.compareTo(BigDecimal.ZERO) == 0) return anomalies;

        for (Expense e : expenses) {
            BigDecimal zScore = e.getAmount().subtract(mean)
                    .divide(stddev, 4, RoundingMode.HALF_UP).abs();

            if (zScore.compareTo(new BigDecimal("2.0")) > 0) {
                int confidence = Math.min(99, 50 + zScore.intValue() * 20);
                anomalies.add(AnomalyResponse.builder()
                        .expenseId(e.getId())
                        .type("DEPENSE_ANORMALE")
                        .description("Depense '" + e.getTitle() + "' de " + e.getAmount() + " TND - Z-Score: "
                                + zScore.setScale(2, RoundingMode.HALF_UP) + " (moyenne: " + mean.setScale(2, RoundingMode.HALF_UP) + " TND)")
                        .confidenceScore(confidence)
                        .zScore(zScore.doubleValue())
                        .detectedAt(LocalDateTime.now())
                        .build());
            }
        }

        return anomalies;
    }

    private List<AnomalyResponse> detectDuplicatePayments(Long clubId) {
        List<Payment> payments = paymentRepository.findByClubIdOrderByCreatedAtDesc(clubId);
        List<AnomalyResponse> anomalies = new ArrayList<>();

        Map<String, List<Payment>> grouped = payments.stream()
                .collect(Collectors.groupingBy(p -> p.getMemberId() + "-" + p.getAmount()));

        for (Map.Entry<String, List<Payment>> entry : grouped.entrySet()) {
            List<Payment> group = entry.getValue();
            if (group.size() >= 2) {
                for (int i = 0; i < group.size() - 1; i++) {
                    Payment a = group.get(i);
                    Payment b = group.get(i + 1);
                    if (a.getCreatedAt() != null && b.getCreatedAt() != null) {
                        long hoursDiff = java.time.Duration.between(b.getCreatedAt(), a.getCreatedAt()).abs().toHours();
                        if (hoursDiff < 24) {
                            anomalies.add(AnomalyResponse.builder()
                                    .paymentId(a.getId())
                                    .type("DOUBLE_PAIEMENT_SUSPECT")
                                    .description("Paiement possible en double: membre #" + a.getMemberId()
                                            + ", montant " + a.getAmount() + " TND, ecart < 24h")
                                    .confidenceScore(85)
                                    .zScore(0)
                                    .detectedAt(LocalDateTime.now())
                                    .build());
                        }
                    }
                }
            }
        }

        return anomalies;
    }

    private BigDecimal mean(List<BigDecimal> values) {
        if (values.isEmpty()) return BigDecimal.ZERO;
        BigDecimal sum = values.stream().reduce(BigDecimal.ZERO, BigDecimal::add);
        return sum.divide(new BigDecimal(values.size()), MathContext.DECIMAL64);
    }

    private BigDecimal stddev(List<BigDecimal> values, BigDecimal mean) {
        if (values.size() < 2) return BigDecimal.ONE;
        BigDecimal sumSq = values.stream()
                .map(v -> v.subtract(mean).pow(2))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal variance = sumSq.divide(new BigDecimal(values.size() - 1), MathContext.DECIMAL64);
        return BigDecimal.valueOf(Math.sqrt(variance.doubleValue()));
    }
}
