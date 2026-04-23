package esprit.com.aiservice.dto;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Data
@Document(collection = "generated_contents")
public class GeneratedContent {
    @Id
    private String id;
    private String type; // "MOTIVATION_LETTER" ou "PROGRAM"
    private String content;
    private String userId;
    private String clubId;
    private LocalDateTime createdAt;
    private Object metadata; // Données supplémentaires (nom, compétences, etc.)
}
