package esprit.com.clubhub.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import esprit.com.clubhub.entity.Election;
import esprit.com.clubhub.entity.ElectionAttendance;
import esprit.com.clubhub.entity.Member;
import esprit.com.clubhub.repository.ElectionAttendanceRepository;
import esprit.com.clubhub.repository.ElectionRepository;
import esprit.com.clubhub.repository.ClubRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class ElectionAttendanceService {

    @Autowired
    private ElectionAttendanceRepository attendanceRepository;

    @Autowired
    private ElectionRepository electionRepository;

    @Autowired
    private ClubRepository clubRepository;

    @Autowired
    private GmailEmailService emailService;

    private static final SecureRandom random = new SecureRandom();
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Valide un QR code scanné et enregistre la présence
     * 
     * @param electionId ID de l'élection
     * @param qrData Données décodées du QR code (JSON)
     * @param scannedBy ID du responsable qui scanne
     * @return ElectionAttendance créé
     */
    public ElectionAttendance validateQRCode(String electionId, String qrData, String scannedBy) {
        try {
            System.out.println("🔍 Validation QR Code pour élection: " + electionId);
            System.out.println("   Données QR: " + qrData);

            // Parser les données du QR code
            @SuppressWarnings("unchecked")
            Map<String, Object> data = objectMapper.readValue(qrData, Map.class);

            String userId = (String) data.get("userId");
            String name = (String) data.get("name");
            String email = (String) data.get("email");
            String qrElectionId = (String) data.get("electionId");

            // Vérifier que le QR code correspond à cette élection
            if (!electionId.equals(qrElectionId)) {
                throw new RuntimeException("Ce QR code n'est pas valide pour cette élection");
            }

            // Vérifier que l'élection existe et est ouverte
            Election election = electionRepository.findById(electionId)
                    .orElseThrow(() -> new RuntimeException("Élection non trouvée"));

            if (!"OPEN".equals(election.getStatus())) {
                throw new RuntimeException("L'élection n'est pas ouverte");
            }

            // Vérifier si le membre n'a pas déjà été scanné
            if (attendanceRepository.existsByElectionIdAndUserId(electionId, userId)) {
                throw new RuntimeException("Ce membre a déjà été enregistré comme présent");
            }

            // Créer l'enregistrement de présence
            ElectionAttendance attendance = new ElectionAttendance(electionId, userId, email, name, scannedBy);

            // Générer un token unique pour voter
            String votingToken = generateVotingToken();
            attendance.setVotingToken(votingToken);

            // Sauvegarder
            ElectionAttendance saved = attendanceRepository.save(attendance);

            System.out.println("✅ Présence enregistrée pour: " + name);
            System.out.println("   Token généré: " + votingToken);

            // Envoyer l'email avec le lien de vote
            sendVotingLinkEmail(saved, election);

            return saved;

        } catch (Exception e) {
            System.err.println("❌ Erreur validation QR Code: " + e.getMessage());
            throw new RuntimeException("Erreur lors de la validation du QR code: " + e.getMessage());
        }
    }

    /**
     * Génère un token unique pour voter
     */
    private String generateVotingToken() {
        byte[] tokenBytes = new byte[32];
        random.nextBytes(tokenBytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(tokenBytes);
    }

    /**
     * Envoie l'email avec le lien de vote après validation du QR
     */
    private void sendVotingLinkEmail(ElectionAttendance attendance, Election election) {
        try {
            emailService.sendVotingLinkEmail(
                attendance.getEmail(),
                attendance.getName(),
                election,
                attendance.getVotingToken()
            );
            System.out.println("✅ Email de lien de vote envoyé à: " + attendance.getEmail());
        } catch (Exception e) {
            System.err.println("❌ Erreur envoi email lien de vote: " + e.getMessage());
        }
    }

    /**
     * Vérifie si un token est valide
     */
    public boolean isTokenValid(String token) {
        Optional<ElectionAttendance> attendance = attendanceRepository.findByVotingToken(token);
        if (attendance.isEmpty()) {
            return false;
        }

        // Vérifier que le token n'a pas déjà été utilisé
        if (attendance.get().isHasVoted()) {
            return false;
        }

        // Vérifier que le token n'est pas expiré (24h)
        LocalDateTime scannedAt = attendance.get().getScannedAt();
        LocalDateTime expiryTime = scannedAt.plusHours(24);
        if (LocalDateTime.now().isAfter(expiryTime)) {
            return false;
        }

        return true;
    }

    /**
     * Récupère l'attendance par token
     */
    public Optional<ElectionAttendance> getByToken(String token) {
        return attendanceRepository.findByVotingToken(token);
    }

    /**
     * Marque un membre comme ayant voté
     */
    public void markAsVoted(String token) {
        Optional<ElectionAttendance> attendance = attendanceRepository.findByVotingToken(token);
        if (attendance.isPresent()) {
            ElectionAttendance att = attendance.get();
            att.setHasVoted(true);
            att.setVotedAt(LocalDateTime.now());
            attendanceRepository.save(att);
            System.out.println("✅ Membre marqué comme ayant voté: " + att.getName());
        }
    }

    /**
     * Récupère la liste des présents pour une élection
     */
    public List<ElectionAttendance> getAttendanceList(String electionId) {
        return attendanceRepository.findByElectionId(electionId);
    }

    /**
     * Récupère les statistiques de présence
     */
    public Map<String, Object> getAttendanceStats(String electionId) {
        long totalPresent = attendanceRepository.countByElectionId(electionId);
        long totalVoted = attendanceRepository.countByElectionIdAndHasVoted(electionId, true);

        return Map.of(
            "totalPresent", totalPresent,
            "totalVoted", totalVoted,
            "pendingVotes", totalPresent - totalVoted
        );
    }

    /**
     * Vérifie si un responsable peut scanner les QR codes
     */
    public boolean canScanQRCodes(String clubId, String userId) {
        return clubRepository.findById(clubId)
                .map(club -> club.getMembers().stream()
                        .filter(m -> m.getUserId().equals(userId))
                        .anyMatch(m -> {
                            // Président peut toujours scanner
                            if ("PRESIDENT".equals(m.getRole())) {
                                return true;
                            }
                            // Membres du comité event peuvent scanner
                            if (m.getSubGroupId() != null) {
                                return club.getSubGroups().stream()
                                        .filter(sg -> sg.getId().equals(m.getSubGroupId()))
                                        .anyMatch(sg -> sg.getName().toLowerCase().contains("event"));
                            }
                            return false;
                        }))
                .orElse(false);
    }
}
