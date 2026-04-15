package esprit.com.clubhub.service;

import esprit.com.clubhub.entity.CustomRole;
import esprit.com.clubhub.entity.Permission;
import esprit.com.clubhub.entity.Role;
import esprit.com.clubhub.entity.User;
import esprit.com.clubhub.repository.UserRepo;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class PermissionService {

    private final UserRepo userRepo;
    private final CustomRoleService customRoleService;

    public PermissionService(UserRepo userRepo, CustomRoleService customRoleService) {
        this.userRepo = userRepo;
        this.customRoleService = customRoleService;
    }

    /**
     * Récupère toutes les permissions d'un utilisateur (système + personnalisées)
     */
    public List<String> getUserPermissions(String userId) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));

        System.out.println("=== DEBUG PERMISSIONS ===");
        System.out.println("User ID: " + userId);
        System.out.println("User role: " + user.getRole());
        System.out.println("User customRoleId: " + user.getCustomRoleId());
        System.out.println("Is system role: " + user.isSystemRole());

        List<String> permissions = new ArrayList<>();

        // 1. Permissions du rôle système
        if (user.isSystemRole()) {
            System.out.println("✅ Rôle système détecté: " + user.getSystemRole());
            permissions.addAll(getSystemRolePermissions(user.getSystemRole()));
        } else {
            System.out.println("❌ Pas un rôle système");
        }

        // 2. Permissions du rôle personnalisé
        if (user.getCustomRoleId() != null && !user.getCustomRoleId().isEmpty()) {
            System.out.println("✅ CustomRoleId trouvé: " + user.getCustomRoleId());
            try {
                CustomRole customRole = customRoleService.getRoleById(user.getCustomRoleId());
                System.out.println("✅ Rôle personnalisé récupéré: " + customRole.getRoleName());
                System.out.println("✅ Permissions du rôle: " + customRole.getPermissions());
                if (customRole.isActive()) {
                    permissions.addAll(customRole.getPermissions());
                    System.out.println("✅ Permissions ajoutées");
                } else {
                    System.out.println("❌ Rôle inactif");
                }
            } catch (Exception e) {
                System.out.println("❌ Erreur récupération rôle: " + e.getMessage());
            }
        } else {
            System.out.println("❌ Pas de customRoleId");
        }

        System.out.println("📋 Permissions finales: " + permissions);
        System.out.println("========================");

        return permissions;
    }

    /**
     * Vérifie si un utilisateur a une permission spécifique
     */
    public boolean hasPermission(String userId, String permission) {
        List<String> userPermissions = getUserPermissions(userId);
        return userPermissions.contains(permission);
    }

    /**
     * Vérifie si un utilisateur a au moins une des permissions données
     */
    public boolean hasAnyPermission(String userId, String... permissions) {
        List<String> userPermissions = getUserPermissions(userId);
        for (String permission : permissions) {
            if (userPermissions.contains(permission)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Vérifie si un utilisateur a toutes les permissions données
     */
    public boolean hasAllPermissions(String userId, String... permissions) {
        List<String> userPermissions = getUserPermissions(userId);
        for (String permission : permissions) {
            if (!userPermissions.contains(permission)) {
                return false;
            }
        }
        return true;
    }

    /**
     * Permissions par défaut pour les rôles système
     */
    private List<String> getSystemRolePermissions(Role role) {
        List<String> permissions = new ArrayList<>();
        
        switch (role) {
            case PRESIDENT:
                // Le président a TOUTES les permissions
                for (Permission p : Permission.values()) {
                    permissions.add(p.name());
                }
                break;
                
            case VICE_PRESIDENT:
                permissions.add("VIEW_MEMBERS");
                permissions.add("ADD_MEMBERS");
                permissions.add("EDIT_MEMBERS");
                permissions.add("VIEW_SUBGROUPS");
                permissions.add("CREATE_SUBGROUPS");
                permissions.add("VIEW_ELECTIONS");
                permissions.add("CREATE_ELECTIONS");
                permissions.add("VIEW_EVENTS");
                permissions.add("CREATE_EVENTS");
                permissions.add("VIEW_CLUB_INFO");
                break;
                
            case SECRETAIRE_GENERALE:
                permissions.add("VIEW_MEMBERS");
                permissions.add("ADD_MEMBERS");
                permissions.add("EDIT_MEMBERS");
                permissions.add("APPROVE_MEMBERS");
                permissions.add("VIEW_SUBGROUPS");
                permissions.add("VIEW_ELECTIONS");
                permissions.add("VIEW_EVENTS");
                permissions.add("VIEW_CLUB_INFO");
                permissions.add("VIEW_REPORTS");
                permissions.add("CREATE_REPORTS");
                break;
                
            case TRESORIER:
                permissions.add("VIEW_MEMBERS");
                permissions.add("VIEW_CLUB_INFO");
                permissions.add("VIEW_EVENTS");
                permissions.add("VIEW_REPORTS");
                permissions.add("CREATE_REPORTS");
                permissions.add("VIEW_ANALYTICS");
                break;
                
            case RH:
                permissions.add("VIEW_MEMBERS");
                permissions.add("ADD_MEMBERS");
                permissions.add("EDIT_MEMBERS");
                permissions.add("DELETE_MEMBERS");
                permissions.add("APPROVE_MEMBERS");
                permissions.add("VIEW_SUBGROUPS");
                permissions.add("ASSIGN_TO_SUBGROUPS");
                break;
                
            case MEMBRE_SIMPLE:
                permissions.add("VIEW_MEMBERS");
                permissions.add("VIEW_SUBGROUPS");
                permissions.add("VIEW_ELECTIONS");
                permissions.add("VOTE_ELECTIONS");
                permissions.add("VIEW_EVENTS");
                permissions.add("VIEW_CLUB_INFO");
                permissions.add("JOIN_VOICE_CHANNELS");
                break;
        }
        
        return permissions;
    }
}
