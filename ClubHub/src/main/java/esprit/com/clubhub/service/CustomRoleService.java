package esprit.com.clubhub.service;

import esprit.com.clubhub.entity.CustomRole;
import esprit.com.clubhub.entity.Permission;
import esprit.com.clubhub.repository.CustomRoleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class CustomRoleService {

    @Autowired
    private CustomRoleRepository customRoleRepository;

    /**
     * Récupère tous les rôles d'un club
     */
    public List<CustomRole> getRolesByClub(String clubId) {
        return customRoleRepository.findByClubId(clubId);
    }

    /**
     * Récupère uniquement les rôles actifs d'un club
     */
    public List<CustomRole> getActiveRolesByClub(String clubId) {
        return customRoleRepository.findByClubIdAndIsActive(clubId, true);
    }

    /**
     * Récupère un rôle par son ID
     */
    public Optional<CustomRole> getRoleById(String id) {
        return customRoleRepository.findById(id);
    }

    /**
     * Crée un nouveau rôle personnalisé
     */
    public CustomRole createRole(CustomRole role) {
        // Vérifier que le nom du rôle n'existe pas déjà pour ce club
        if (customRoleRepository.existsByClubIdAndRoleName(role.getClubId(), role.getRoleName())) {
            throw new IllegalArgumentException("Un rôle avec ce nom existe déjà pour ce club");
        }

        // Valider les permissions
        validatePermissions(role.getPermissions());

        role.setCreatedAt(LocalDateTime.now());
        role.setUpdatedAt(LocalDateTime.now());
        role.setActive(true);

        return customRoleRepository.save(role);
    }

    /**
     * Met à jour un rôle existant
     */
    public CustomRole updateRole(String id, CustomRole updatedRole) {
        CustomRole existingRole = customRoleRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Rôle introuvable"));

        // Vérifier que le nouveau nom n'est pas déjà utilisé (sauf si c'est le même rôle)
        Optional<CustomRole> roleWithSameName = customRoleRepository
                .findByClubIdAndRoleName(existingRole.getClubId(), updatedRole.getRoleName());
        
        if (roleWithSameName.isPresent() && !roleWithSameName.get().getId().equals(id)) {
            throw new IllegalArgumentException("Un rôle avec ce nom existe déjà pour ce club");
        }

        // Valider les permissions
        validatePermissions(updatedRole.getPermissions());

        existingRole.setRoleName(updatedRole.getRoleName());
        existingRole.setDescription(updatedRole.getDescription());
        existingRole.setPermissions(updatedRole.getPermissions());
        existingRole.setActive(updatedRole.isActive());
        existingRole.setUpdatedAt(LocalDateTime.now());

        return customRoleRepository.save(existingRole);
    }

    /**
     * Supprime un rôle (soft delete)
     */
    public void deleteRole(String id) {
        CustomRole role = customRoleRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Rôle introuvable"));
        
        role.setActive(false);
        role.setUpdatedAt(LocalDateTime.now());
        customRoleRepository.save(role);
    }

    /**
     * Supprime définitivement un rôle
     */
    public void hardDeleteRole(String id) {
        customRoleRepository.deleteById(id);
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

    /**
     * Valide que les permissions existent
     */
    private void validatePermissions(List<String> permissions) {
        if (permissions == null || permissions.isEmpty()) {
            throw new IllegalArgumentException("Au moins une permission doit être sélectionnée");
        }

        Set<String> validPermissions = Arrays.stream(Permission.values())
                .map(Permission::getCode)
                .collect(Collectors.toSet());

        for (String permission : permissions) {
            if (!validPermissions.contains(permission)) {
                throw new IllegalArgumentException("Permission invalide: " + permission);
            }
        }
    }

    /**
     * Récupère les permissions d'un rôle spécifique
     */
    public List<String> getRolePermissions(String roleId) {
        return customRoleRepository.findById(roleId)
                .map(CustomRole::getPermissions)
                .orElse(Collections.emptyList());
    }
}
