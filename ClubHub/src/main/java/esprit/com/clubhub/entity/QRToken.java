package esprit.com.clubhub.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

/**
 * Token QR pour validation de présence aux élections présentielles
 */
@Document(collection = "qr_tokens")
public class QRToken {

    @Id
    private String id;
    private String token;           // Token unique du QR code
    private String electionId;      // ID de l'élection
    private String userId;          // ID du membre
    private String email;           // Email du membre
    private String name;            // Nom du membre
    private String role;            // Rôle dans le club
    private String photoUrl;        // URL de la photo (optionnel)
    private boolean isCandidate;    // Est candidat ?
    private String status;          // PENDING, VALIDATED, REJECTED, USED
    private LocalDateTime createdAt;
    private LocalDateTime validatedAt;
    private String validatedBy;     // ID du responsable qui a validé
    private String votingToken;     // Token de vote généré après validation
    private LocalDateTime expiresAt; // Date d'expiration (24h)

    public QRToken() {
        this.createdAt = LocalDateTime.now();
        this.expiresAt = LocalDateTime.now().plusHours(24);
        this.status = "PENDING";
    }

    public QRToken(String token, String electionId, String userId, String email, String name, 
                   String role, boolean isCandidate) {
        this.token = token;
        this.electionId = electionId;
        this.userId = userId;
        this.email = email;
        this.name = name;
        this.role = role;
        this.isCandidate = isCandidate;
        this.createdAt = LocalDateTime.now();
        this.expiresAt = LocalDateTime.now().plusHours(24);
        this.status = "PENDING";
    }

    // Getters
    public String getId() { return id; }
    public String getToken() { return token; }
    public String getElectionId() { return electionId; }
    public String getUserId() { return userId; }
    public String getEmail() { return email; }
    public String getName() { return name; }
    public String getRole() { return role; }
    public String getPhotoUrl() { return photoUrl; }
    public boolean isCandidate() { return isCandidate; }
    public String getStatus() { return status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getValidatedAt() { return validatedAt; }
    public String getValidatedBy() { return validatedBy; }
    public String getVotingToken() { return votingToken; }
    public LocalDateTime getExpiresAt() { return expiresAt; }

    // Setters
    public void setId(String id) { this.id = id; }
    public void setToken(String token) { this.token = token; }
    public void setElectionId(String electionId) { this.electionId = electionId; }
    public void setUserId(String userId) { this.userId = userId; }
    public void setEmail(String email) { this.email = email; }
    public void setName(String name) { this.name = name; }
    public void setRole(String role) { this.role = role; }
    public void setPhotoUrl(String photoUrl) { this.photoUrl = photoUrl; }
    public void setCandidate(boolean candidate) { isCandidate = candidate; }
    public void setStatus(String status) { this.status = status; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public void setValidatedAt(LocalDateTime validatedAt) { this.validatedAt = validatedAt; }
    public void setValidatedBy(String validatedBy) { this.validatedBy = validatedBy; }
    public void setVotingToken(String votingToken) { this.votingToken = votingToken; }
    public void setExpiresAt(LocalDateTime expiresAt) { this.expiresAt = expiresAt; }
}
