package esprit.com.clubhub.service;

import esprit.com.clubhub.entity.CustomRole;
import esprit.com.clubhub.entity.Member;
import esprit.com.clubhub.entity.Permission;
import esprit.com.clubhub.repository.ClubRepository;
import esprit.com.clubhub.repository.CustomRoleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class PermissionService {

    @Autowired
    private CustomRoleRepository customRoleRepository;

    @Autowired
    private ClubRepository clubRepository;

    /**
     * Récupère toutes les permissions d'un utilisateur
     * Combine les permissions du rôle système + rôle personnalisé
     */
    public List<String> getUserPermissions(String userId) {
        Set<String> permissions = new HashSet<>();

        try {
            System.out.println("🔍 PermissionService - Récupération des permissions pour userId: " + userId);
            
            // Trouver le membre dans tous les clubs
            clubRepository.findAll().forEach(club -> {
                try {
                    System.out.println("   📋 Vérification du club: " + club.getName() + " (ID: " + club.getId() + ")");
                    
                    // Vérifier que le club a des membres
                    if (club.getMembers() == null || club.getMembers().isEmpty()) {
                        System.out.println("   ⚠️  Club sans membres, skip");
                        return;
                    }
                    
                    club.getMembers().stream()
                            .filter(member -> member != null && member.getUserId() != null)
                            .filter(member -> member.getUserId().equals(userId))
                            .findFirst()
                            .ifPresent(member -> {
                                System.out.println("   ✅ Membre trouvé avec rôle: " + member.getRole());
                                
                                // Ajouter les permissions du rôle système
                                List<String> systemPerms = getSystemRolePermissions(member.getRole());
                                permissions.addAll(systemPerms);
                                System.out.println("   📝 Permissions système ajoutées: " + systemPerms.size());

                                // Ajouter les permissions du rôle personnalisé si présent
                                // Chercher dans le champ role si c'est un rôle personnalisé
                                try {
                                    customRoleRepository.findByClubIdAndRoleName(club.getId(), member.getRole())
                                            .ifPresent(customRole -> {
                                                System.out.println("   🎭 Rôle personnalisé trouvé: " + customRole.getRoleName());
                                                if (customRole.isActive()) {
                                                    permissions.addAll(customRole.getPermissions());
                                                    System.out.println("   📝 Permissions personnalisées ajoutées: " + customRole.getPermissions().size());
                                                } else {
                                                    System.out.println("   ⚠️  Rôle personnalisé inactif");
                                                }
                                            });
                                } catch (Exception e) {
                                    System.err.println("   ❌ Erreur lors de la recherche du rôle personnalisé: " + e.getMessage());
                                }
                            });
                } catch (Exception e) {
                    System.err.println("   ❌ Erreur lors du traitement du club " + club.getId() + ": " + e.getMessage());
                    e.printStackTrace();
                }
            });
            
            System.out.println("✅ Total permissions trouvées: " + permissions.size());
            
        } catch (Exception e) {
            System.err.println("❌ Erreur globale dans getUserPermissions: " + e.getMessage());
            e.printStackTrace();
        }

        return new ArrayList<>(permissions);
    }

    /**
     * Vérifie si un utilisateur a une permission spécifique
     */
    public boolean hasPermission(String userId, String permission) {
        return getUserPermissions(userId).contains(permission);
    }

    /**
     * Vérifie si un utilisateur a au moins une des permissions
     */
    public boolean hasAnyPermission(String userId, String... permissions) {
        List<String> userPermissions = getUserPermissions(userId);
        return Arrays.stream(permissions).anyMatch(userPermissions::contains);
    }

    /**
     * Vérifie si un utilisateur a toutes les permissions
     */
    public boolean hasAllPermissions(String userId, String... permissions) {
        List<String> userPermissions = getUserPermissions(userId);
        return Arrays.stream(permissions).allMatch(userPermissions::contains);
    }

    /**
     * Récupère les permissions par défaut d'un rôle système
     */
    private List<String> getSystemRolePermissions(String role) {
        switch (role) {
            case "PRESIDENT":
                // Le président a toutes les permissions
                return Arrays.stream(Permission.values())
                        .map(Permission::getCode)
                        .collect(Collectors.toList());

            case "VICE_PRESIDENT":
                return Arrays.asList(
                        Permission.VIEW_MEMBERS.getCode(),
                        Permission.ADD_MEMBERS.getCode(),
                        Permission.EDIT_MEMBERS.getCode(),
                        Permission.APPROVE_MEMBERS.getCode(),
                        Permission.VIEW_COMMITTEES.getCode(),
                        Permission.CREATE_COMMITTEES.getCode(),
                        Permission.EDIT_COMMITTEES.getCode(),
                        Permission.ASSIGN_TO_COMMITTEES.getCode(),
                        Permission.VIEW_ELECTIONS.getCode(),
                        Permission.CREATE_ELECTIONS.getCode(),
                        Permission.EDIT_ELECTIONS.getCode(),
                        Permission.VOTE_ELECTIONS.getCode(),
                        Permission.VIEW_RESULTS.getCode(),
                        Permission.VIEW_EVENTS.getCode(),
                        Permission.CREATE_EVENTS.getCode(),
                        Permission.EDIT_EVENTS.getCode(),
                        Permission.VIEW_CLUB.getCode(),
                        Permission.VIEW_ANALYTICS.getCode()
                );

            case "SECRETAIRE_GENERALE":
                return Arrays.asList(
                        Permission.VIEW_MEMBERS.getCode(),
                        Permission.ADD_MEMBERS.getCode(),
                        Permission.EDIT_MEMBERS.getCode(),
                        Permission.APPROVE_MEMBERS.getCode(),
                        Permission.VIEW_COMMITTEES.getCode(),
                        Permission.VIEW_ELECTIONS.getCode(),
                        Permission.VOTE_ELECTIONS.getCode(),
                        Permission.VIEW_RESULTS.getCode(),
                        Permission.VIEW_EVENTS.getCode(),
                        Permission.CREATE_EVENTS.getCode(),
                        Permission.EDIT_EVENTS.getCode(),
                        Permission.VIEW_CLUB.getCode(),
                        Permission.SEND_NOTIFICATIONS.getCode()
                );

            case "TRESORIER":
                return Arrays.asList(
                        Permission.VIEW_MEMBERS.getCode(),
                        Permission.VIEW_COMMITTEES.getCode(),
                        Permission.VIEW_ELECTIONS.getCode(),
                        Permission.VOTE_ELECTIONS.getCode(),
                        Permission.VIEW_EVENTS.getCode(),
                        Permission.VIEW_CLUB.getCode(),
                        Permission.VIEW_ANALYTICS.getCode()
                );

            case "RH":
                return Arrays.asList(
                        Permission.VIEW_MEMBERS.getCode(),
                        Permission.ADD_MEMBERS.getCode(),
                        Permission.EDIT_MEMBERS.getCode(),
                        Permission.DELETE_MEMBERS.getCode(),
                        Permission.APPROVE_MEMBERS.getCode(),
                        Permission.VIEW_COMMITTEES.getCode(),
                        Permission.ASSIGN_TO_COMMITTEES.getCode(),
                        Permission.VIEW_ELECTIONS.getCode(),
                        Permission.VOTE_ELECTIONS.getCode(),
                        Permission.VIEW_CLUB.getCode(),
                        Permission.VIEW_ROLES.getCode(),
                        Permission.ASSIGN_ROLES.getCode()
                );

            case "MEMBRE_SIMPLE":
                return Arrays.asList(
                        Permission.VIEW_MEMBERS.getCode(),
                        Permission.VIEW_COMMITTEES.getCode(),
                        Permission.VIEW_ELECTIONS.getCode(),
                        Permission.VOTE_ELECTIONS.getCode(),
                        Permission.VIEW_EVENTS.getCode(),
                        Permission.VIEW_CLUB.getCode()
                );

            default:
                // Pour les rôles personnalisés ou inconnus
                return Collections.emptyList();
        }
    }

    /**
     * Récupère toutes les permissions disponibles
     */
    public List<Map<String, String>> getAllPermissions() {
        return Arrays.stream(Permission.values())
                .map(p -> {
                    Map<String, String> permMap = new HashMap<>();
                    permMap.put("code", p.getCode());
                    permMap.put("label", p.getLabel());
                    permMap.put("description", p.getDescription());
                    return permMap;
                })
                .collect(Collectors.toList());
    }
}
