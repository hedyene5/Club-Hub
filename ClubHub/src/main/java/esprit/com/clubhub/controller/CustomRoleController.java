package esprit.com.clubhub.controller;

import esprit.com.clubhub.entity.CustomRole;
import esprit.com.clubhub.service.CustomRoleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/roles")
@CrossOrigin(origins = "*")
public class CustomRoleController {

    @Autowired
    private CustomRoleService customRoleService;

    /**
     * Récupère tous les rôles d'un club
     */
    @GetMapping("/club/{clubId}")
    public ResponseEntity<List<CustomRole>> getRolesByClub(@PathVariable String clubId) {
        try {
            List<CustomRole> roles = customRoleService.getRolesByClub(clubId);
            return ResponseEntity.ok(roles);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Récupère uniquement les rôles actifs d'un club
     */
    @GetMapping("/club/{clubId}/active")
    public ResponseEntity<List<CustomRole>> getActiveRolesByClub(@PathVariable String clubId) {
        try {
            List<CustomRole> roles = customRoleService.getActiveRolesByClub(clubId);
            return ResponseEntity.ok(roles);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Récupère un rôle par son ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<CustomRole> getRoleById(@PathVariable String id) {
        return customRoleService.getRoleById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Crée un nouveau rôle personnalisé
     */
    @PostMapping
    public ResponseEntity<?> createRole(@RequestBody CustomRole role) {
        try {
            CustomRole createdRole = customRoleService.createRole(role);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdRole);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Erreur lors de la création du rôle"));
        }
    }

    /**
     * Met à jour un rôle existant
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateRole(@PathVariable String id, @RequestBody CustomRole role) {
        try {
            CustomRole updatedRole = customRoleService.updateRole(id, role);
            return ResponseEntity.ok(updatedRole);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Erreur lors de la mise à jour du rôle"));
        }
    }

    /**
     * Supprime un rôle (soft delete)
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteRole(@PathVariable String id) {
        try {
            customRoleService.deleteRole(id);
            return ResponseEntity.ok(Map.of("message", "Rôle supprimé avec succès"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Erreur lors de la suppression du rôle"));
        }
    }

    /**
     * Récupère toutes les permissions disponibles
     */
    @GetMapping("/permissions")
    public ResponseEntity<List<Map<String, String>>> getAllPermissions() {
        try {
            List<Map<String, String>> permissions = customRoleService.getAllPermissions();
            return ResponseEntity.ok(permissions);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Récupère les permissions d'un rôle spécifique
     */
    @GetMapping("/{id}/permissions")
    public ResponseEntity<List<String>> getRolePermissions(@PathVariable String id) {
        try {
            List<String> permissions = customRoleService.getRolePermissions(id);
            return ResponseEntity.ok(permissions);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
