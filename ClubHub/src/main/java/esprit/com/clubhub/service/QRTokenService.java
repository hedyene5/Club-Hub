package esprit.com.clubhub.service;

import esprit.com.clubhub.entity.Election;
import esprit.com.clubhub.entity.QRToken;
import esprit.com.clubhub.repository.ElectionRepository;
import esprit.com.clubhub.repository.QRTokenRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

@Service
public class QRTokenService {

    @Autowired
    private QRTokenRepository qrTokenRepository;

    @Autowired
    private ElectionRepository electionRepository;

    @Autowired
    private QRCodeService qrCodeService;

    @Autowired
    private GmailEmailService emailService;

    @Autowired
    private VotingCodeService votingCodeService;

    /**
     * Crée un QR token pour un membre
     */
    public QRToken createQRToken(String electionId, String userId, String email, String name, 
                                  String role, boolean isCandidate, String photoUrl) {
        // Vérifier si un token existe déjà pour ce membre et cette élection
        Optional<QRToken> existing = qrTokenRepository.findByElectionIdAndUserId(electionId, userId);
        if (existing.isPresent()) {
            System.out.println("⚠️ Token QR déjà existant pour " + name);
            return existing.get();
        }

        // Générer un nouveau token
        String token = qrCodeService.generateQRToken();

        QRToken qrToken = new QRToken(token, electionId, userId, email, name, role, isCandidate);
        qrToken.setPhotoUrl(photoUrl);

        QRToken saved = qrTokenRepository.save(qrToken);
        System.out.println("✅ QR Token créé pour: " + name + " (Token: " + token + ")");

        return saved;
    }

    /**
     * Récupère les informations d'un QR token
     */
    public Optional<QRToken> getQRTokenInfo(String token) {
        return qrTokenRepository.findByToken(token);
    }

    /**
     * Valide la présence d'un membre (bouton ✅)
     */
    public Map<String, Object> validatePresence(String token, String validatedBy) {
        Optional<QRToken> qrTokenOpt = qrTokenRepository.findByToken(token);

        if (qrTokenOpt.isEmpty()) {
            return Map.of("success", false, "message", "Token QR invalide");
        }

        QRToken qrToken = qrTokenOpt.get();

        // Vérifier que le token n'est pas expiré
        if (LocalDateTime.now().isAfter(qrToken.getExpiresAt())) {
            return Map.of("success", false, "message", "Token QR expiré");
        }

        // Vérifier que le token n'a pas déjà été utilisé
        if ("VALIDATED".equals(qrToken.getStatus()) || "USED".equals(qrToken.getStatus())) {
            return Map.of("success", false, "message", "Présence déjà validée");
        }

        if ("REJECTED".equals(qrToken.getStatus())) {
            return Map.of("success", false, "message", "Présence rejetée précédemment");
        }

        // Récupérer l'élection
        Election election = electionRepository.findById(qrToken.getElectionId())
                .orElseThrow(() -> new RuntimeException("Élection non trouvée"));

        // Générer un token de vote
        String votingToken = votingCodeService.generateUniqueCode();
        qrToken.setVotingToken(votingToken);
        qrToken.setStatus("VALIDATED");
        qrToken.setValidatedAt(LocalDateTime.now());
        qrToken.setValidatedBy(validatedBy);

        qrTokenRepository.save(qrToken);

        System.out.println("✅ Présence validée pour: " + qrToken.getName());
        System.out.println("   Token de vote: " + votingToken);

        // Envoyer l'email de validation avec le lien de vote
        try {
            emailService.sendPresenceValidatedEmail(
                qrToken.getEmail(),
                qrToken.getName(),
                election,
                votingToken
            );
            System.out.println("✅ Email de validation envoyé à: " + qrToken.getEmail());
        } catch (Exception e) {
            System.err.println("❌ Erreur envoi email: " + e.getMessage());
        }

        return Map.of(
            "success", true,
            "message", "Présence validée avec succès",
            "memberName", qrToken.getName(),
            "votingToken", votingToken
        );
    }

    /**
     * Rejette la présence d'un membre (bouton ❌)
     */
    public Map<String, Object> rejectPresence(String token, String validatedBy, String reason) {
        Optional<QRToken> qrTokenOpt = qrTokenRepository.findByToken(token);

        if (qrTokenOpt.isEmpty()) {
            return Map.of("success", false, "message", "Token QR invalide");
        }

        QRToken qrToken = qrTokenOpt.get();

        // Vérifier que le token n'a pas déjà été traité
        if ("VALIDATED".equals(qrToken.getStatus()) || "USED".equals(qrToken.getStatus())) {
            return Map.of("success", false, "message", "Présence déjà validée, impossible de rejeter");
        }

        // Récupérer l'élection
        Election election = electionRepository.findById(qrToken.getElectionId())
                .orElseThrow(() -> new RuntimeException("Élection non trouvée"));

        qrToken.setStatus("REJECTED");
        qrToken.setValidatedAt(LocalDateTime.now());
        qrToken.setValidatedBy(validatedBy);

        qrTokenRepository.save(qrToken);

        System.out.println("❌ Présence rejetée pour: " + qrToken.getName());

        // Envoyer l'email de rejet
        try {
            emailService.sendPresenceRejectedEmail(
                qrToken.getEmail(),
                qrToken.getName(),
                election,
                reason
            );
            System.out.println("✅ Email de rejet envoyé à: " + qrToken.getEmail());
        } catch (Exception e) {
            System.err.println("❌ Erreur envoi email: " + e.getMessage());
        }

        return Map.of(
            "success", true,
            "message", "Présence rejetée",
            "memberName", qrToken.getName()
        );
    }

    /**
     * Vérifie si un token de vote est valide
     */
    public boolean isVotingTokenValid(String votingToken) {
        Optional<QRToken> qrToken = qrTokenRepository.findByVotingToken(votingToken);

        if (qrToken.isEmpty()) {
            return false;
        }

        QRToken token = qrToken.get();

        // Le token doit être validé et non utilisé
        return "VALIDATED".equals(token.getStatus()) && 
               LocalDateTime.now().isBefore(token.getExpiresAt());
    }

    /**
     * Marque un token de vote comme utilisé
     */
    public void markVotingTokenAsUsed(String votingToken) {
        Optional<QRToken> qrToken = qrTokenRepository.findByVotingToken(votingToken);

        if (qrToken.isPresent()) {
            QRToken token = qrToken.get();
            token.setStatus("USED");
            qrTokenRepository.save(token);
            System.out.println("✅ Token de vote marqué comme utilisé");
        }
    }

    /**
     * Récupère les statistiques de présence
     */
    public Map<String, Object> getPresenceStats(String electionId) {
        long total = qrTokenRepository.findByElectionId(electionId).size();
        long validated = qrTokenRepository.countByElectionIdAndStatus(electionId, "VALIDATED");
        long rejected = qrTokenRepository.countByElectionIdAndStatus(electionId, "REJECTED");
        long used = qrTokenRepository.countByElectionIdAndStatus(electionId, "USED");
        long pending = total - validated - rejected - used;

        return Map.of(
            "total", total,
            "validated", validated,
            "rejected", rejected,
            "used", used,
            "pending", pending
        );
    }
}
