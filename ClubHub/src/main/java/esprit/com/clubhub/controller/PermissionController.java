package esprit.com.clubhub.controller;

import esprit.com.clubhub.service.PermissionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/permissions")
@CrossOrigin(origins = "*")
public class PermissionController {

    @Autowired
    private PermissionService permissionService;

    /**
     * Récupère toutes les permissions d'un utilisateur
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<String>> getUserPermissions(@PathVariable String userId) {
        try {
            System.out.println("🌐 PermissionController - GET /api/permissions/user/" + userId);
            List<String> permissions = permissionService.getUserPermissions(userId);
            System.out.println("✅ Permissions récupérées: " + permissions.size());
            return ResponseEntity.ok(permissions);
        } catch (Exception e) {
            System.err.println("❌ Erreur dans getUserPermissions: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Vérifie si un utilisateur a une permission spécifique
     */
    @PostMapping("/check")
    public ResponseEntity<Map<String, Boolean>> checkPermission(@RequestBody Map<String, String> request) {
        try {
            String userId = request.get("userId");
            String permission = request.get("permission");
            
            System.out.println("🌐 PermissionController - POST /api/permissions/check - userId: " + userId + ", permission: " + permission);
            boolean hasPermission = permissionService.hasPermission(userId, permission);
            return ResponseEntity.ok(Map.of("hasPermission", hasPermission));
        } catch (Exception e) {
            System.err.println("❌ Erreur dans checkPermission: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Récupère toutes les permissions disponibles
     */
    @GetMapping("/all")
    public ResponseEntity<List<Map<String, String>>> getAllPermissions() {
        try {
            System.out.println("🌐 PermissionController - GET /api/permissions/all");
            List<Map<String, String>> permissions = permissionService.getAllPermissions();
            System.out.println("✅ Permissions disponibles: " + permissions.size());
            return ResponseEntity.ok(permissions);
        } catch (Exception e) {
            System.err.println("❌ Erreur dans getAllPermissions: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
