package esprit.com.aiservice.service;

import esprit.com.aiservice.dto.*;
import esprit.com.aiservice.repository.GeneratedContentRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.util.Map;

@Slf4j
@Service
public class AiGenerationService {

    private final WebClient webClient;
    private final GeneratedContentRepository repository;

    @Value("${ai.service.python.url}")
    private String pythonServiceUrl;

    public AiGenerationService(WebClient.Builder webClientBuilder, 
                              GeneratedContentRepository repository) {
        this.webClient = webClientBuilder.build();
        this.repository = repository;
    }

    /**
     * Génère une lettre de motivation via le service Python
     */
    public Mono<Map<String, Object>> generateMotivationLetter(MotivationLetterRequest request, 
                                                               String userId, 
                                                               String clubId) {
        log.info("Génération de lettre de motivation pour {}", request.getCandidateName());

        return webClient.post()
                .uri(pythonServiceUrl + "/generate/motivation-letter")
                .bodyValue(request)
                .retrieve()
                .bodyToMono(new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {})
                .doOnSuccess(response -> {
                    // Sauvegarder dans MongoDB
                    saveGeneratedContent(
                        "MOTIVATION_LETTER",
                        (String) response.get("letter"),
                        userId,
                        clubId,
                        request
                    );
                    log.info("Lettre générée et sauvegardée avec succès");
                })
                .doOnError(error -> log.error("Erreur lors de la génération: {}", error.getMessage()));
    }

    /**
     * Génère un programme d'activités via le service Python
     */
    public Mono<Map<String, Object>> generateProgram(ProgramRequest request, 
                                                      String userId, 
                                                      String clubId) {
        log.info("Génération de programme pour {}", request.getClubName());

        return webClient.post()
                .uri(pythonServiceUrl + "/generate/program")
                .bodyValue(request)
                .retrieve()
                .bodyToMono(new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {})
                .doOnSuccess(response -> {
                    // Sauvegarder dans MongoDB
                    saveGeneratedContent(
                        "PROGRAM",
                        (String) response.get("program"),
                        userId,
                        clubId,
                        request
                    );
                    log.info("Programme généré et sauvegardé avec succès");
                })
                .doOnError(error -> log.error("Erreur lors de la génération: {}", error.getMessage()));
    }

    /**
     * Vérifie la santé du service Python
     */
    public Mono<Map<String, Object>> checkPythonServiceHealth() {
        return webClient.get()
                .uri(pythonServiceUrl + "/health")
                .retrieve()
                .bodyToMono(new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {})
                .doOnError(error -> log.error("Service Python non disponible: {}", error.getMessage()));
    }

    /**
     * Sauvegarde le contenu généré dans MongoDB
     */
    private void saveGeneratedContent(String type, String content, String userId, 
                                     String clubId, Object metadata) {
        GeneratedContent generatedContent = new GeneratedContent();
        generatedContent.setType(type);
        generatedContent.setContent(content);
        generatedContent.setUserId(userId);
        generatedContent.setClubId(clubId);
        generatedContent.setCreatedAt(LocalDateTime.now());
        generatedContent.setMetadata(metadata);
        
        repository.save(generatedContent);
    }

    /**
     * Récupère l'historique des contenus générés par un utilisateur
     */
    public java.util.List<GeneratedContent> getUserHistory(String userId) {
        return repository.findByUserId(userId);
    }

    /**
     * Récupère l'historique des contenus générés pour un club
     */
    public java.util.List<GeneratedContent> getClubHistory(String clubId) {
        return repository.findByClubId(clubId);
    }
}
