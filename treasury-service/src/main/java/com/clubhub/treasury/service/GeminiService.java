package com.clubhub.treasury.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Service
public class GeminiService {

    private static final Logger log = LoggerFactory.getLogger(GeminiService.class);

    @Value("${gemini.api-key:}")
    private String apiKey;

    @Value("${gemini.model:gemini-2.0-flash}")
    private String model;

    @Value("${gemini.max-tokens:2048}")
    private int maxTokens;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public boolean isAvailable() {
        return apiKey != null && !apiKey.isBlank() && !"placeholder".equals(apiKey);
    }

    public String ask(String prompt) {
        if (!isAvailable()) {
            return generateFallbackResponse(prompt);
        }

        try {
            String url = "https://generativelanguage.googleapis.com/v1beta/models/" + model
                    + ":generateContent?key=" + apiKey;

            Map<String, Object> body = Map.of(
                    "contents", List.of(Map.of(
                            "parts", List.of(Map.of("text", prompt))
                    )),
                    "generationConfig", Map.of(
                            "maxOutputTokens", maxTokens,
                            "temperature", 0.3
                    )
            );

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            ResponseEntity<String> response = restTemplate.exchange(
                    url, HttpMethod.POST,
                    new HttpEntity<>(objectMapper.writeValueAsString(body), headers),
                    String.class
            );

            JsonNode root = objectMapper.readTree(response.getBody());
            return root.at("/candidates/0/content/parts/0/text").asText("Pas de reponse.");

        } catch (Exception e) {
            log.error("Gemini API error: {}", e.getMessage());
            return generateFallbackResponse(prompt);
        }
    }

    /**
     * Version RAG : tente Gemini, en cas d'echec utilise un fallback intelligent
     * base sur la question originale ET le contexte BDD.
     */
    public String askWithFallbackContext(String augmentedPrompt, String originalQuestion, String dbContext) {
        if (!isAvailable()) {
            return buildSmartFallback(originalQuestion, dbContext);
        }
        try {
            String url = String.format(
                    "https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s",
                    model, apiKey);

            Map<String, Object> body = Map.of(
                    "contents", List.of(Map.of(
                            "parts", List.of(Map.of("text", augmentedPrompt))
                    )),
                    "generationConfig", Map.of(
                            "maxOutputTokens", maxTokens,
                            "temperature", 0.3
                    )
            );

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            ResponseEntity<String> response = restTemplate.exchange(
                    url, HttpMethod.POST,
                    new HttpEntity<>(objectMapper.writeValueAsString(body), headers),
                    String.class
            );

            JsonNode root = objectMapper.readTree(response.getBody());
            return root.at("/candidates/0/content/parts/0/text").asText("Pas de reponse.");

        } catch (Exception e) {
            log.error("Gemini API error (RAG): {}", e.getMessage().substring(0, Math.min(200, e.getMessage().length())));
            return buildSmartFallback(originalQuestion, dbContext);
        }
    }

    /** Fallback intelligent : extrait les chiffres cles du contexte BDD */
    private String buildSmartFallback(String question, String dbContext) {
        String q = question.toLowerCase();

        // Extraire les stats du contexte
        String stats = "";
        for (String line : dbContext.split("\n")) {
            String l = line.trim();
            if (l.startsWith("- ") && l.contains(":")) {
                stats += l + "\n";
            }
        }

        if (q.contains("retard")) {
            return extractFromContext(dbContext, "retard", "Voici les informations sur les paiements en retard extraites de la base de donnees:\n" + stats);
        }
        if (q.contains("budget")) {
            return extractFromContext(dbContext, "BUDGET", "Voici la situation budgetaire:\n" + stats);
        }
        if (q.contains("depense")) {
            return extractFromContext(dbContext, "DEPENSE", "Voici le resume des depenses:\n" + stats);
        }
        if (q.contains("recouvrement") || q.contains("taux")) {
            return extractFromContext(dbContext, "recouvrement", "Voici les indicateurs de recouvrement:\n" + stats);
        }
        if (q.contains("resume") || q.contains("situation") || q.contains("general")) {
            return "Voici un resume base sur les donnees actuelles:\n" + stats;
        }

        return "Voici les donnees disponibles:\n" + stats
                + "\n(Mode hors-ligne : l'IA Gemini est temporairement indisponible. Les donnees ci-dessus sont extraites directement de la base de donnees.)";
    }

    private String extractFromContext(String ctx, String keyword, String prefix) {
        StringBuilder sb = new StringBuilder(prefix);
        for (String line : ctx.split("\n")) {
            if (line.toLowerCase().contains(keyword.toLowerCase()) && line.trim().startsWith("-")) {
                sb.append(line.trim()).append("\n");
            }
        }
        return sb.toString().trim();
    }

    public String categorizeExpense(String title, String description) {
        String prompt = """
                Tu es un assistant financier pour un club universitaire tunisien.
                Categorise cette depense dans UNE des categories suivantes:
                FOURNITURES, TRANSPORT, HEBERGEMENT, RESTAURATION, MATERIEL, COMMUNICATION, EVENEMENT, AUTRE

                Titre: %s
                Description: %s

                Reponds UNIQUEMENT au format JSON:
                {"category": "CATEGORIE", "confidence": 85, "reason": "explication courte"}
                """.formatted(title, description != null ? description : "");

        return ask(prompt);
    }

    public String chatTreasury(String question, String financialContext) {
        String prompt = """
                Tu es l'assistant IA tresorerie de ClubHub, une plateforme de gestion de clubs universitaires tunisiens.
                La devise est le TND (Dinar Tunisien).

                Contexte financier du club:
                %s

                Question du membre: %s

                Reponds de maniere concise et utile en francais. Si tu ne connais pas la reponse exacte,
                donne des conseils generaux bases sur le contexte fourni.
                """.formatted(financialContext, question);

        return ask(prompt);
    }

    public String analyzeBudgetTrend(String historicalData) {
        String prompt = """
                Tu es un analyste financier IA pour un club universitaire tunisien (devise: TND).

                Donnees historiques des transactions:
                %s

                Analyse les tendances et fournis:
                1. Prediction des revenus pour les 3 prochains mois
                2. Prediction des depenses pour les 3 prochains mois
                3. Alertes si un deficit est prevu
                4. Recommandations

                Reponds au format JSON:
                {
                  "predictions": [
                    {"month": "Mai 2026", "predictedRevenue": 800, "predictedExpenses": 600, "balance": 200, "confidence": 75, "trend": "STABLE"}
                  ],
                  "alerts": ["alerte 1"],
                  "recommendations": ["recommandation 1"]
                }
                """.formatted(historicalData);

        return ask(prompt);
    }

    private String generateFallbackResponse(String prompt) {
        String lower = prompt.toLowerCase();

        if (lower.contains("categori")) {
            return "{\"category\": \"AUTRE\", \"confidence\": 50, \"reason\": \"Classification par defaut (API Gemini non configuree)\"}";
        }
        if (lower.contains("prediction") || lower.contains("tendance") || lower.contains("trend")) {
            return """
                    {"predictions": [
                      {"month": "Mai 2026", "predictedRevenue": 750, "predictedExpenses": 500, "balance": 250, "confidence": 60, "trend": "STABLE"},
                      {"month": "Juin 2026", "predictedRevenue": 700, "predictedExpenses": 450, "balance": 250, "confidence": 55, "trend": "STABLE"},
                      {"month": "Juil 2026", "predictedRevenue": 400, "predictedExpenses": 300, "balance": 100, "confidence": 50, "trend": "DOWN"}
                    ],
                    "alerts": ["Baisse prevue en periode estivale (juillet)"],
                    "recommendations": ["Planifier les cotisations avant la periode creuse", "Reduire les depenses non essentielles en ete"]}
                    """;
        }
        if (lower.contains("taux") || lower.contains("recouvrement")) {
            return "Le taux de recouvrement represente le pourcentage des cotisations effectivement payees par rapport au total attendu. Un bon taux est superieur a 80%.";
        }
        if (lower.contains("retard")) {
            return "Les membres en retard sont ceux dont le paiement depasse la date d'echeance sans avoir ete regle. Le systeme les marque automatiquement comme LATE chaque jour a 8h00.";
        }
        if (lower.contains("budget")) {
            return "Le budget est suivi en temps reel. Des alertes sont declenchees a 50%, 75%, 90% et 100% de consommation pour prevenir les depassements.";
        }

        return "Je suis l'assistant IA tresorerie de ClubHub. Je peux vous aider avec les cotisations, depenses, budgets, et rapports financiers. (Mode fallback - configurez GEMINI_API_KEY pour des reponses completes)";
    }
}
