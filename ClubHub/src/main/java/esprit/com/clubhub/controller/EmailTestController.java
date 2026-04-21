package esprit.com.clubhub.controller;

import esprit.com.clubhub.service.GmailEmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/email-test")
@CrossOrigin(origins = "http://localhost:4200")
public class EmailTestController {

    @Autowired
    private GmailEmailService emailService;

    @Value("${gmail.user.email:NOT_CONFIGURED}")
    private String gmailUserEmail;

    /**
     * Diagnostic complet de la configuration email Gmail API
     */
    @GetMapping("/diagnostic")
    public ResponseEntity<Map<String, Object>> diagnostic() {
        Map<String, Object> result = new HashMap<>();
        
        // 1. Vérifier la configuration
        Map<String, Object> config = new HashMap<>();
        config.put("gmailUserEmail", gmailUserEmail);
        config.put("configured", !gmailUserEmail.equals("NOT_CONFIGURED") && 
                                 !gmailUserEmail.equals("votre-email@gmail.com"));
        result.put("configuration", config);
        
        // 2. Vérifier le service Email
        result.put("emailServiceBean", emailService != null ? "✅ Présent" : "❌ Absent");
        result.put("gmailServiceInitialized", emailService != null && emailService.isInitialized() ? "✅ Initialisé" : "❌ Non initialisé");
        
        // 3. Recommandations
        List<String> recommendations = new ArrayList<>();
        if (gmailUserEmail.equals("votre-email@gmail.com") || gmailUserEmail.equals("NOT_CONFIGURED")) {
            recommendations.add("❌ CRITIQUE: Vous devez configurer gmail.user.email dans application.properties");
            recommendations.add("📝 Étape 1: Placez le fichier credentials.json dans le dossier ClubHub/");
            recommendations.add("📝 Étape 2: Configurez gmail.user.email dans application.properties");
            recommendations.add("📝 Étape 3: Ajoutez-vous comme utilisateur test dans Google Cloud Console");
            recommendations.add("📝 Étape 4: Au premier démarrage, autorisez l'application dans le navigateur");
        } else if (emailService == null || !emailService.isInitialized()) {
            recommendations.add("⚠️ Service Gmail non initialisé");
            recommendations.add("📝 Vérifiez que le fichier credentials.json est présent");
            recommendations.add("📝 Vérifiez les logs au démarrage de l'application");
        } else {
            recommendations.add("✅ Configuration Gmail API détectée");
            recommendations.add("💡 Utilisez /api/email-test/send pour tester l'envoi");
        }
        result.put("recommendations", recommendations);
        
        return ResponseEntity.ok(result);
    }

    /**
     * Envoyer un email de test via Gmail API
     */
    @PostMapping("/send")
    public ResponseEntity<Map<String, Object>> sendTestEmail(@RequestBody Map<String, String> request) {
        Map<String, Object> result = new HashMap<>();
        
        try {
            String toEmail = request.get("email");
            
            if (toEmail == null || toEmail.isEmpty()) {
                result.put("success", false);
                result.put("error", "Email destinataire requis");
                return ResponseEntity.badRequest().body(result);
            }
            
            // Vérifier la configuration
            if (gmailUserEmail.equals("votre-email@gmail.com") || gmailUserEmail.equals("NOT_CONFIGURED")) {
                result.put("success", false);
                result.put("error", "Configuration Gmail non effectuée");
                result.put("help", "Modifiez application.properties avec votre email Gmail");
                return ResponseEntity.badRequest().body(result);
            }
            
            // Vérifier que le service est initialisé
            if (emailService == null || !emailService.isInitialized()) {
                result.put("success", false);
                result.put("error", "Service Gmail non initialisé");
                result.put("help", "Vérifiez que credentials.json est présent et que vous avez autorisé l'application");
                return ResponseEntity.badRequest().body(result);
            }
            
            // Créer le contenu HTML de l'email de test
            String htmlContent = "<html><body>" +
                "<h2>✅ Test Email Réussi !</h2>" +
                "<p>Si vous recevez cet email, votre configuration Gmail API est correcte.</p>" +
                "<p><strong>Configuration détectée:</strong></p>" +
                "<ul>" +
                "<li>Gmail User: " + gmailUserEmail + "</li>" +
                "<li>API: Google Gmail API v1</li>" +
                "</ul>" +
                "<p>Le système d'emails automatiques est maintenant opérationnel ! 🎉</p>" +
                "</body></html>";
            
            System.out.println("📧 Tentative d'envoi d'email de test via Gmail API...");
            System.out.println("   De: " + gmailUserEmail);
            System.out.println("   À: " + toEmail);
            
            emailService.sendEmail(toEmail, "🧪 Test Email - ClubHub", htmlContent);
            
            System.out.println("✅ Email de test envoyé avec succès !");
            
            result.put("success", true);
            result.put("message", "Email de test envoyé avec succès à " + toEmail);
            result.put("from", gmailUserEmail);
            result.put("to", toEmail);
            
        } catch (Exception e) {
            System.err.println("❌ ERREUR lors de l'envoi de l'email de test:");
            System.err.println("   Message: " + e.getMessage());
            e.printStackTrace();
            
            result.put("success", false);
            result.put("error", e.getMessage());
            result.put("errorType", e.getClass().getSimpleName());
            
            // Diagnostics spécifiques selon l'erreur
            List<String> solutions = new ArrayList<>();
            String errorMsg = e.getMessage() != null ? e.getMessage().toLowerCase() : "";
            
            if (errorMsg.contains("credentials") || errorMsg.contains("not found")) {
                solutions.add("❌ Fichier credentials.json non trouvé");
                solutions.add("✅ Solution: Placez le fichier credentials.json dans le dossier ClubHub/");
            } else if (errorMsg.contains("authorization") || errorMsg.contains("token")) {
                solutions.add("❌ Problème d'autorisation OAuth2");
                solutions.add("✅ Solution 1: Supprimez le dossier 'tokens' et redémarrez l'application");
                solutions.add("✅ Solution 2: Vérifiez que vous êtes ajouté comme utilisateur test dans Google Cloud Console");
            } else if (errorMsg.contains("quota") || errorMsg.contains("rate")) {
                solutions.add("❌ Limite de quota Gmail API atteinte");
                solutions.add("✅ Solution: Attendez quelques minutes avant de réessayer");
            } else {
                solutions.add("❌ Erreur inconnue");
                solutions.add("✅ Consultez les logs complets ci-dessus");
            }
            
            result.put("solutions", solutions);
        }
        
        return ResponseEntity.ok(result);
    }

    /**
     * Vérifier les emails des membres d'un club
     */
    @GetMapping("/check-club-members/{clubId}")
    public ResponseEntity<Map<String, Object>> checkClubMembers(@PathVariable String clubId) {
        Map<String, Object> result = new HashMap<>();
        
        try {
            // Appeler le service Club pour récupérer les membres
            org.springframework.web.client.RestTemplate restTemplate = new org.springframework.web.client.RestTemplate();
            String url = "http://localhost:8083/api/clubs/" + clubId;
            
            @SuppressWarnings("unchecked")
            Map<String, Object> clubData = restTemplate.getForObject(url, Map.class);
            
            if (clubData == null) {
                result.put("error", "Club non trouvé");
                return ResponseEntity.notFound().build();
            }
            
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> members = (List<Map<String, Object>>) clubData.get("members");
            
            List<Map<String, Object>> memberEmails = new ArrayList<>();
            int validEmails = 0;
            int invalidEmails = 0;
            
            if (members != null) {
                for (Map<String, Object> member : members) {
                    String email = (String) member.get("email");
                    String name = (String) member.get("name");
                    
                    Map<String, Object> memberInfo = new HashMap<>();
                    memberInfo.put("name", name);
                    memberInfo.put("email", email);
                    memberInfo.put("valid", email != null && !email.isEmpty() && email.contains("@"));
                    
                    if (email != null && !email.isEmpty() && email.contains("@")) {
                        validEmails++;
                    } else {
                        invalidEmails++;
                    }
                    
                    memberEmails.add(memberInfo);
                }
            }
            
            result.put("clubId", clubId);
            result.put("clubName", clubData.get("name"));
            result.put("totalMembers", members != null ? members.size() : 0);
            result.put("validEmails", validEmails);
            result.put("invalidEmails", invalidEmails);
            result.put("members", memberEmails);
            
            if (invalidEmails > 0) {
                result.put("warning", invalidEmails + " membre(s) n'ont pas d'email valide");
            }
            
        } catch (Exception e) {
            result.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(result);
        }
        
        return ResponseEntity.ok(result);
    }
}
