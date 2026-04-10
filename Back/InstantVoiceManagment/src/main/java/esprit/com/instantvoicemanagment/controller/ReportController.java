package esprit.com.instantvoicemanagment.controller;

import esprit.com.instantvoicemanagment.entity.AudioReport;
import esprit.com.instantvoicemanagment.entity.Notification;
import esprit.com.instantvoicemanagment.repository.AudioReportRepo;
import esprit.com.instantvoicemanagment.repository.NotificationRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final AudioReportRepo reportRepo;
    private final NotificationRepo notifRepo;

    @PostMapping
    public ResponseEntity<AudioReport> createReport(@RequestBody AudioReport report) {
        report.setStatus("PENDING");
        report.setCreatedAt(LocalDateTime.now());
        return ResponseEntity.ok(reportRepo.save(report));
    }

    @GetMapping
    public List<AudioReport> getReports(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String reportedByUserId) {
        if (reportedByUserId != null && !reportedByUserId.isBlank()) {
            return reportRepo.findByReportedByUserIdOrderByCreatedAtDesc(reportedByUserId);
        }
        if (status != null && !status.isBlank() && !status.equals("ALL")) {
            return reportRepo.findByStatusOrderByCreatedAtDesc(status);
        }
        return reportRepo.findAllByOrderByCreatedAtDesc();
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<AudioReport> updateStatus(
            @PathVariable String id,
            @RequestBody Map<String, String> body) {
        return reportRepo.findById(id).map(report -> {
            String newStatus = body.get("status");
            report.setStatus(newStatus);

            String decisionType = body.get("decisionType");
            String decisionText = body.get("decisionText");

            if (decisionType != null && !decisionType.isBlank()) {
                report.setDecisionType(decisionType);
                report.setDecisionText(decisionText);
                report.setTreatedAt(LocalDateTime.now());
            }

            AudioReport saved = reportRepo.save(report);

            // Notify the reporter when their report is reviewed with a decision
            if ("REVIEWED".equals(newStatus) && decisionType != null && !decisionType.isBlank()) {
                String decisionLabel = decisionTypeLabel(decisionType);
                String msg = "Your report about " + report.getReportedUserName()
                        + " has been reviewed. Decision: " + decisionLabel
                        + (decisionText != null && !decisionText.isBlank() ? " — " + decisionText : "");

                Notification notif = new Notification();
                notif.setUserId(report.getReportedByUserId());
                notif.setMessage(msg);
                notif.setReportId(report.getId());
                notif.setReportedUserId(report.getReportedUserId());
                notifRepo.save(notif);
            }

            return ResponseEntity.ok(saved);
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteReport(@PathVariable String id) {
        reportRepo.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private String decisionTypeLabel(String type) {
        return switch (type) {
            case "WARNING" -> "Warning issued";
            case "BAN_FROM_CHANNEL" -> "Banned from channel";
            default -> type;
        };
    }
}
