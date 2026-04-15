package clubhub.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;
import java.util.List;

@Document(collection = "conversations")
public class Conversation {

    @Id
    private String id;

    private String nom;
    private String description;
    private TypeConversation type;       // PRIVATE ou GROUP

    // ✅ On ne stocke pas un objet User — juste son ID (String)
    private String createdByUserId;

    private LocalDateTime createdAt;
    private String lastMessageId;        // référence vers le dernier message

    // ✅ Les participants sont dans une collection séparée
    // On ne les embed pas ici pour faciliter les requêtes

    public enum TypeConversation {
        PRIVATE, GROUP
    }

    // Constructeurs
    public Conversation() {}

    public Conversation(String nom, String description, TypeConversation type, String createdByUserId) {
        this.nom = nom;
        this.description = description;
        this.type = type;
        this.createdByUserId = createdByUserId;
        this.createdAt = LocalDateTime.now();
    }

    // Getters & Setters
    public String getId() { return id; }
    public String getNom() { return nom; }
    public void setNom(String nom) { this.nom = nom; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public TypeConversation getType() { return type; }
    public void setType(TypeConversation type) { this.type = type; }
    public String getCreatedByUserId() { return createdByUserId; }
    public void setCreatedByUserId(String createdByUserId) { this.createdByUserId = createdByUserId; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public String getLastMessageId() { return lastMessageId; }
    public void setLastMessageId(String lastMessageId) { this.lastMessageId = lastMessageId; }
}