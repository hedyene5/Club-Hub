package esprit.com.instantvoicemanagment.controller;

import esprit.com.instantvoicemanagment.entity.AudioReport;
import esprit.com.instantvoicemanagment.repository.AudioReportRepo;
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

    @PostMapping
    public ResponseEntity<AudioReport> createReport(@RequestBody AudioReport report) {
        report.setStatus("PENDING");
        report.setCreatedAt(LocalDateTime.now());
        return ResponseEntity.ok(reportRepo.save(report));
    }

    @GetMapping
    public List<AudioReport> getReports(@RequestParam(required = false) String status) {
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
            report.setStatus(body.get("status"));
            return ResponseEntity.ok(reportRepo.save(report));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteReport(@PathVariable String id) {
        reportRepo.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
