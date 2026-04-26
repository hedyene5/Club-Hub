package tn.esprit.clubhub.Service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import tn.esprit.clubhub.Entity.BorrowedItem;
import tn.esprit.clubhub.Entity.Devis;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;

/**
 * Cross-service integration: pushes validated borrowed-item expenses
 * to the Treasury microservice (port 8082).
 */
@Service
@Slf4j
public class TreasuryIntegrationService {

    private final RestTemplate restTemplate = new RestTemplate();
    private static final String TREASURY_BASE = "http://localhost:8082/api/v1/treasury";

    // Default clubId used for cross-service submissions
    private static final long DEFAULT_CLUB_ID = 1L;

    /**
     * After a devis is validated on a borrowed item that has 3 quotes,
     * create a matching expense in Treasury so the treasurer can approve it.
     *
     * @param item       the BorrowedItem whose devis was just validated
     * @param allDevis   all devis (quotes) attached to this borrowed item
     * @param jwtCookie  the JWT cookie value from the current user session (forwarded for auth)
     */
    public void createExpenseInTreasury(BorrowedItem item, List<Devis> allDevis, String jwtCookie) {
        if (allDevis == null || allDevis.size() < 3) {
            log.info("Skipping treasury integration: item {} has only {} devis (need 3)",
                    item.getId(), allDevis != null ? allDevis.size() : 0);
            return;
        }

        try {
            // Build the 3 quotes array (take first 3 devis)
            List<Map<String, Object>> quotes = new ArrayList<>();
            BigDecimal total = BigDecimal.ZERO;

            for (int i = 0; i < 3 && i < allDevis.size(); i++) {
                Devis d = allDevis.get(i);
                Map<String, Object> quote = new LinkedHashMap<>();
                quote.put("providerName", d.getSupplierName() != null ? d.getSupplierName() : "Fournisseur " + (i + 1));
                BigDecimal amount = d.getAmount() != null
                        ? BigDecimal.valueOf(d.getAmount())
                        : BigDecimal.ZERO;
                quote.put("amount", amount);
                quote.put("description", d.getNotes() != null ? d.getNotes() : "Devis #" + (i + 1));
                quotes.add(quote);
                total = total.add(amount);
            }

            // Average of the 3 quotes as the expense amount
            BigDecimal averageAmount = total.divide(BigDecimal.valueOf(3), 2, RoundingMode.HALF_UP);

            // Build the request body matching CreateExpenseRequest
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("title", item.getItemName() != null ? item.getItemName() : "Emprunt materiel");
            body.put("description", "Emprunt materiel - " +
                    (item.getEventName() != null ? item.getEventName() : "Evenement"));
            body.put("amount", averageAmount);
            body.put("quotes", quotes);

            // Build headers with JWT cookie forwarding
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            if (jwtCookie != null && !jwtCookie.isBlank()) {
                headers.add("Cookie", jwtCookie);
            }

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

            String url = TREASURY_BASE + "/" + DEFAULT_CLUB_ID + "/expenses";
            log.info("Sending expense to Treasury: POST {} | title={} amount={}",
                    url, body.get("title"), averageAmount);

            ResponseEntity<String> response = restTemplate.exchange(
                    url, HttpMethod.POST, request, String.class);

            if (response.getStatusCode().is2xxSuccessful()) {
                log.info("Expense created in Treasury for item {}. Response: {}",
                        item.getId(), response.getBody());
            } else {
                log.warn("Treasury returned non-2xx: {} for item {}",
                        response.getStatusCode(), item.getId());
            }

        } catch (Exception e) {
            // Treasury might be down — log and continue, do NOT break the devis validation flow
            log.error("Failed to create expense in Treasury for item {}: {}",
                    item.getId(), e.getMessage());
        }
    }
}
