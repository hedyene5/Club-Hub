package esprit.com.aiservice.controller;

import esprit.com.aiservice.dto.*;
import esprit.com.aiservice.service.AiGenerationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/ai")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class AiController {

    private final AiGenerationService aiService;

    /**
     * POST /api/ai/generate/motivation-letter
     * Génère une lettre de motivation personnalisée
     */
    @PostMapping("/generate/motivation-letter")
    public Mono<ResponseEntity<Map<String, Object>>> generateMotivationLetter(
            @RequestBody MotivationLetterRequest request,
            @RequestParam(required = false) String userId,
            @RequestParam(required = false) String clubId) {
        
        log.info("Requête de génération de lettre pour {}", request.getCandidateName());
        
        return aiService.generateMotivationLetter(request, userId, clubId)
                .map(ResponseEntity::ok)
                .onErrorResume(error -> {
                    log.error("Erreur: {}", error.getMessage());
                    return Mono.just(ResponseEntity.internalServerError()
                            .body(Map.of("error", error.getMessage())));
                });
    }

    /**
     * POST /api/ai/generate/program
     * Génère un programme d'activités
     */
    @PostMapping("/generate/program")
    public Mono<ResponseEntity<Map<String, Object>>> generateProgram(
            @RequestBody ProgramRequest request,
            @RequestParam(required = false) String userId,
            @RequestParam(required = false) String clubId) {
        
        log.info("Requête de génération de programme pour {}", request.getClubName());
        
        return aiService.generateProgram(request, userId, clubId)
                .map(ResponseEntity::ok)
                .onErrorResume(error -> {
                    log.error("Erreur: {}", error.getMessage());
                    return Mono.just(ResponseEntity.internalServerError()
                            .body(Map.of("error", error.getMessage())));
                });
    }

    /**
     * GET /api/ai/health
     * Vérifie la santé du service IA
     */
    @GetMapping("/health")
    public Mono<ResponseEntity<Map<String, Object>>> checkHealth() {
        return aiService.checkPythonServiceHealth()
                .map(ResponseEntity::ok)
                .onErrorResume(error -> 
                    Mono.just(ResponseEntity.internalServerError()
                            .body(Map.of("status", "unhealthy", "error", error.getMessage()))));
    }

    /**
     * GET /api/ai/history/user/{userId}
     * Récupère l'historique des générations d'un utilisateur
     */
    @GetMapping("/history/user/{userId}")
    public ResponseEntity<List<GeneratedContent>> getUserHistory(@PathVariable String userId) {
        return ResponseEntity.ok(aiService.getUserHistory(userId));
    }

    /**
     * GET /api/ai/history/club/{clubId}
     * Récupère l'historique des générations d'un club
     */
    @GetMapping("/history/club/{clubId}")
    public ResponseEntity<List<GeneratedContent>> getClubHistory(@PathVariable String clubId) {
        return ResponseEntity.ok(aiService.getClubHistory(clubId));
    }
}
