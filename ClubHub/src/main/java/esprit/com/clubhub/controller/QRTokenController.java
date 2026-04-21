package esprit.com.clubhub.controller;

import esprit.com.clubhub.entity.QRToken;
import esprit.com.clubhub.service.QRTokenService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/qr-tokens")
@CrossOrigin(origins = "*")
public class QRTokenController {

    @Autowired
    private QRTokenService qrTokenService;

    /**
     * Récupérer les informations d'un QR token
     * GET /api/qr-tokens/{token}
     */
    @GetMapping("/{token}")
    public ResponseEntity<?> getQRTokenInfo(@PathVariable String token) {
        return qrTokenService.getQRTokenInfo(token)
                .map(qrToken -> ResponseEntity.ok(Map.of(
                    "success", true,
                    "data", Map.of(
                        "userId", qrToken.getUserId(),
                        "name", qrToken.getName(),
                        "email", qrToken.getEmail(),
                        "role", qrToken.getRole(),
                        "photoUrl", qrToken.getPhotoUrl() != null ? qrToken.getPhotoUrl() : "",
                        "isCandidate", qrToken.isCandidate(),
                        "status", qrToken.getStatus(),
                        "electionId", qrToken.getElectionId()
                    )
                )))
                .orElse(ResponseEntity.ok(Map.of(
                    "success", false,
                    "message", "Token QR invalide ou expiré"
                )));
    }

    /**
     * Valider la présence d'un membre
     * POST /api/qr-tokens/{token}/validate
     * Body: { "validatedBy": "userId" }
     */
    @PostMapping("/{token}/validate")
    public ResponseEntity<Map<String, Object>> validatePresence(
            @PathVariable String token,
            @RequestBody Map<String, String> request) {
        
        String validatedBy = request.get("validatedBy");
        
        if (validatedBy == null || validatedBy.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "validatedBy est requis"
            ));
        }

        Map<String, Object> result = qrTokenService.validatePresence(token, validatedBy);
        
        if ((Boolean) result.get("success")) {
            return ResponseEntity.ok(result);
        } else {
            return ResponseEntity.badRequest().body(result);
        }
    }

    /**
     * Rejeter la présence d'un membre
     * POST /api/qr-tokens/{token}/reject
     * Body: { "validatedBy": "userId", "reason": "..." }
     */
    @PostMapping("/{token}/reject")
    public ResponseEntity<Map<String, Object>> rejectPresence(
            @PathVariable String token,
            @RequestBody Map<String, String> request) {
        
        String validatedBy = request.get("validatedBy");
        String reason = request.get("reason");
        
        if (validatedBy == null || validatedBy.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "validatedBy est requis"
            ));
        }

        Map<String, Object> result = qrTokenService.rejectPresence(token, validatedBy, reason);
        
        if ((Boolean) result.get("success")) {
            return ResponseEntity.ok(result);
        } else {
            return ResponseEntity.badRequest().body(result);
        }
    }

    /**
     * Vérifier si un token de vote est valide
     * GET /api/qr-tokens/voting/{votingToken}/validate
     */
    @GetMapping("/voting/{votingToken}/validate")
    public ResponseEntity<Map<String, Object>> validateVotingToken(@PathVariable String votingToken) {
        boolean isValid = qrTokenService.isVotingTokenValid(votingToken);
        
        return ResponseEntity.ok(Map.of(
            "valid", isValid,
            "message", isValid ? "Token valide" : "Token invalide ou expiré"
        ));
    }

    /**
     * Récupérer les statistiques de présence pour une élection
     * GET /api/qr-tokens/stats/{electionId}
     */
    @GetMapping("/stats/{electionId}")
    public ResponseEntity<Map<String, Object>> getPresenceStats(@PathVariable String electionId) {
        Map<String, Object> stats = qrTokenService.getPresenceStats(electionId);
        return ResponseEntity.ok(stats);
    }
}
