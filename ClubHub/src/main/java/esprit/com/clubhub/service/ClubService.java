package esprit.com.clubhub.service;

import esprit.com.clubhub.dto.UserDto;
import esprit.com.clubhub.entity.Club;
import esprit.com.clubhub.entity.ClubRules;
import esprit.com.clubhub.entity.Member;
import esprit.com.clubhub.entity.SubGroup;
import esprit.com.clubhub.entity.*;
import esprit.com.clubhub.dto.SubGroupRecommendation;
import esprit.com.clubhub.repository.ClubRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.HashMap;
import java.util.Map;
import java.time.LocalDateTime;

@Service
public class ClubService {

    @Autowired
    private ClubRepository clubRepository;
    
    @Autowired
    private RestTemplate restTemplate;
    
    private String userServiceUrl = "http://localhost:8081/api/users";  // ✅ Corrigé: ajout de /api
    
    public UserDto getUserById(String userId) {
        try {
            return restTemplate.getForObject(userServiceUrl + "/" + userId, UserDto.class);
        } catch (Exception e) {
            System.err.println("Erreur appel User Service: " + e.getMessage());
            return null;
        }
    }

    // ========== CRUD DE BASE ==========

    public Club createClub(Club club) {
        // Initialisation par défaut
        if (club.getMembers() == null) {
            club.setMembers(new java.util.ArrayList<>());
        }
        if (club.getSubGroups() == null) {
            club.setSubGroups(new java.util.ArrayList<>());
        }
        if (club.getRules() == null) {
            club.setRules(new ClubRules());
        }
        return clubRepository.save(club);
    }

    public List<Club> getAllClubs() {
        return clubRepository.findAll();
    }

    public Optional<Club> getClubById(String id) {
        return clubRepository.findById(id);
    }

    public Club updateClub(String id, Club clubDetails) {
        Club club = clubRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Club non trouvé"));

        System.out.println("=== UPDATE CLUB ===");
        System.out.println("Members reçus: " + (clubDetails.getMembers() != null ? clubDetails.getMembers().size() : "null"));
        System.out.println("Members existants: " + club.getMembers().size());

        // Mise à jour des champs simples
        if (clubDetails.getName() != null) club.setName(clubDetails.getName());
        if (clubDetails.getDescription() != null) club.setDescription(clubDetails.getDescription());
        if (clubDetails.getCategory() != null) club.setCategory(clubDetails.getCategory());
        if (clubDetails.getVisibility() != null) club.setVisibility(clubDetails.getVisibility());
        if (clubDetails.getLogoUrl() != null) club.setLogoUrl(clubDetails.getLogoUrl());
        if (clubDetails.getColorPalette() != null) club.setColorPalette(clubDetails.getColorPalette());
        if (clubDetails.getRules() != null) club.setRules(clubDetails.getRules());

        // ⚠️ NE PAS toucher aux membres et sous-groupes si non fournis
        // On garde ceux qui existent déjà
        if (clubDetails.getMembers() != null && !clubDetails.getMembers().isEmpty()) {
            System.out.println("⚠️ ATTENTION: Remplacement des membres!");
            club.setMembers(clubDetails.getMembers());
        } else {
            System.out.println("✅ Conservation des membres existants: " + club.getMembers().size());
        }

        if (clubDetails.getSubGroups() != null && !clubDetails.getSubGroups().isEmpty()) {
            club.setSubGroups(clubDetails.getSubGroups());
        } else {
            System.out.println("✅ Conservation des sous-groupes existants: " + club.getSubGroups().size());
        }

        return clubRepository.save(club);
    }

    public void deleteClub(String id) {
        clubRepository.deleteById(id);
    }

    // ========== GESTION DES MEMBRES ==========

    public Club addMemberRequest(String clubId, Member member) {
        Club club = clubRepository.findById(clubId)
                .orElseThrow(() -> new RuntimeException("Club non trouvé"));
        System.out.println("=== ADD MEMBER ===");
        System.out.println("Membre reçu complet: " + member.toString());  // ← AJOUTER
        System.out.println("Status reçu: " + member.getStatus());  // ← AJOUTER
        System.out.println("Role reçu: " + member.getRole());

        boolean exists = club.getMembers().stream()
                .anyMatch(m -> m.getUserId().equals(member.getUserId()));

        if (!exists) {
            // ✅ Respecter le status envoyé, sinon PENDING par défaut
            if (member.getStatus() == null || member.getStatus().isEmpty()) {
                member.setStatus("APPROVED");
            }
            // ✅ Respecter le role envoyé, sinon MEMBER par défaut
            if (member.getRole() == null || member.getRole().isEmpty()) {
                member.setRole("MEMBER");
            }
            member.setJoinedDate(LocalDateTime.now());
            club.getMembers().add(member);
            return clubRepository.save(club);
        }
        return club;
    }

    public Club approveMember(String clubId, String userId) {
        Club club = clubRepository.findById(clubId)
                .orElseThrow(() -> new RuntimeException("Club non trouvé"));

        club.getMembers().stream()
                .filter(m -> m.getUserId().equals(userId))
                .findFirst()
                .ifPresent(member -> member.setStatus("APPROVED"));

        return clubRepository.save(club);
    }

    public Club rejectMember(String clubId, String userId) {
        Club club = clubRepository.findById(clubId)
                .orElseThrow(() -> new RuntimeException("Club non trouvé"));

        club.getMembers().removeIf(m -> m.getUserId().equals(userId));
        return clubRepository.save(club);
    }

    public Club changeMemberRole(String clubId, String userId, String newRole) {
        Club club = clubRepository.findById(clubId)
                .orElseThrow(() -> new RuntimeException("Club non trouvé"));

        System.out.println("=== CHANGEMENT RÔLE ===");
        System.out.println("Club: " + clubId);
        System.out.println("User: " + userId);
        System.out.println("Nouveau rôle: " + newRole);

        club.getMembers().stream()
                .filter(m -> m.getUserId().equals(userId))
                .findFirst()
                .ifPresent(member -> {
                    String oldRole = member.getRole();
                    member.setRole(newRole);
                    System.out.println("Rôle changé de " + oldRole + " à " + newRole);
                });

        return clubRepository.save(club);
    }

    // ========== GESTION DES SOUS-GROUPES ==========

    public Club addSubGroup(String clubId, SubGroup subGroup) {
        Club club = clubRepository.findById(clubId)
                .orElseThrow(() -> new RuntimeException("Club non trouvé"));

        subGroup.setId(UUID.randomUUID().toString());
        club.getSubGroups().add(subGroup);

        return clubRepository.save(club);
    }

    public Club removeSubGroup(String clubId, String subGroupId) {
        Club club = clubRepository.findById(clubId)
                .orElseThrow(() -> new RuntimeException("Club non trouvé"));

        club.getSubGroups().removeIf(sg -> sg.getId().equals(subGroupId));
        return clubRepository.save(club);
    }

    public Club assignToSubGroup(String clubId, String userId, String subGroupId, String subGroupRole) {
        System.out.println("=== ASSIGN TO SUBGROUP SERVICE ===");
        System.out.println("ClubId: " + clubId);
        System.out.println("UserId: " + userId);
        System.out.println("SubGroupId: " + subGroupId);
        System.out.println("SubGroupRole: " + subGroupRole);
        
        Club club = clubRepository.findById(clubId)
                .orElseThrow(() -> new RuntimeException("Club non trouvé"));

        // ✅ Récupérer le mode d'appartenance aux comités
        CommitteeMembershipMode mode = club.getRules() != null && club.getRules().getCommitteeMembershipMode() != null
                ? club.getRules().getCommitteeMembershipMode()
                : CommitteeMembershipMode.MULTIPLE_ALLOWED;
        
        System.out.println("📋 Mode d'appartenance aux comités: " + mode);
        
        // ✅ Trouver le membre
        Member member = club.getMembers().stream()
                .filter(m -> m.getUserId().equals(userId))
                .findFirst()
                .orElse(null);
        
        if (member == null) {
            throw new RuntimeException("Membre non trouvé dans le club");
        }
        
        // ✅ RÈGLE 1: Mode SINGLE_ONLY - Un membre ne peut être que dans UN SEUL comité
        if (mode == CommitteeMembershipMode.SINGLE_ONLY) {
            // ✅ FIX: Vérifier dans TOUS les sous-groupes, pas seulement member.subGroupId
            // car en mode MULTIPLE_ALLOWED, subGroupId peut être écrasé
            SubGroup existingSubGroup = club.getSubGroups().stream()
                    .filter(sg -> !sg.getId().equals(subGroupId) && sg.getMemberIds().contains(userId))
                    .findFirst()
                    .orElse(null);
            
            if (existingSubGroup != null) {
                // Le membre est déjà dans un autre comité
                String currentSubGroupName = existingSubGroup.getName();
                System.err.println("❌ Mode SINGLE_ONLY: Le membre est déjà dans le comité '" + currentSubGroupName + "'");
                throw new RuntimeException("Ce club n'autorise qu'un seul comité par membre. Le membre est déjà dans le comité '" + currentSubGroupName + "'. Veuillez d'abord le retirer de ce comité.");
            }
        }
        
        // ✅ RÈGLE 2: Mode MULTIPLE_ALLOWED - Un membre peut être RESPONSABLE d'UN SEUL comité
        if (mode == CommitteeMembershipMode.MULTIPLE_ALLOWED && subGroupRole.equals("RESPONSABLE")) {
            // Vérifier si le membre est déjà responsable d'un autre comité
            boolean isAlreadyResponsable = club.getSubGroups().stream()
                    .anyMatch(sg -> !sg.getId().equals(subGroupId) && userId.equals(sg.getResponsableId()));
            
            if (isAlreadyResponsable) {
                // Trouver le comité dont il est déjà responsable
                SubGroup currentResponsableSubGroup = club.getSubGroups().stream()
                        .filter(sg -> !sg.getId().equals(subGroupId) && userId.equals(sg.getResponsableId()))
                        .findFirst()
                        .orElse(null);
                
                String currentSubGroupName = currentResponsableSubGroup != null ? currentResponsableSubGroup.getName() : "un comité";
                System.err.println("❌ Mode MULTIPLE_ALLOWED: Le membre est déjà RESPONSABLE du comité '" + currentSubGroupName + "'");
                throw new RuntimeException("Un membre ne peut être RESPONSABLE que d'UN SEUL comité. Ce membre est déjà responsable du comité '" + currentSubGroupName + "'. Il peut rejoindre ce comité en tant que MEMBRE_COMITE.");
            }
        }
        
        // ✅ RÈGLE 3: Mode MULTIPLE_ALLOWED - Un RESPONSABLE ne peut appartenir qu'à SON comité
        if (mode == CommitteeMembershipMode.MULTIPLE_ALLOWED) {
            // Vérifier si le membre est déjà RESPONSABLE d'un autre comité
            SubGroup responsableSubGroup = club.getSubGroups().stream()
                    .filter(sg -> userId.equals(sg.getResponsableId()))
                    .findFirst()
                    .orElse(null);
            
            if (responsableSubGroup != null && !responsableSubGroup.getId().equals(subGroupId)) {
                // Le membre est responsable d'un autre comité
                String responsableSubGroupName = responsableSubGroup.getName();
                System.err.println("❌ Mode MULTIPLE_ALLOWED: Le membre est RESPONSABLE du comité '" + responsableSubGroupName + "' et ne peut pas rejoindre un autre comité");
                throw new RuntimeException("Un responsable de comité ne peut appartenir qu'à son propre comité. Ce membre est responsable du comité '" + responsableSubGroupName + "'. Pour rejoindre un autre comité, il doit d'abord quitter son rôle de responsable.");
            }
        }

        // ✅ Trouver le sous-groupe
        SubGroup subGroup = club.getSubGroups().stream()
                .filter(sg -> sg.getId().equals(subGroupId))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Sous-groupe non trouvé"));
        
        System.out.println("📋 Sous-groupe trouvé: " + subGroup.getName());

        // ✅ Mettre à jour le membre dans le club
        club.getMembers().stream()
                .filter(m -> m.getUserId().equals(userId))
                .findFirst()
                .ifPresent(m -> {
                    System.out.println("👤 Membre trouvé: " + m.getName() + " (rôle actuel: " + m.getRole() + ")");
                    
                    // ✅ Sauvegarder le rôle initial si c'est la première fois qu'on l'assigne comme responsable
                    if (subGroupRole.equals("RESPONSABLE") && m.getInitialRole() == null) {
                        m.setInitialRole(m.getRole());
                        System.out.println("📝 Rôle initial sauvegardé: " + m.getRole());
                    }
                    
                    m.setSubGroupId(subGroupId);
                    m.setSubGroupRole(subGroupRole);
                    System.out.println("✅ Membre " + userId + " assigné avec rôle comité: " + subGroupRole);
                });

        // ✅ Mettre à jour le sous-groupe
        club.getSubGroups().stream()
                .filter(sg -> sg.getId().equals(subGroupId))
                .findFirst()
                .ifPresent(sg -> {
                    // Ajouter à la liste des membres si pas déjà présent
                    if (!sg.getMemberIds().contains(userId)) {
                        sg.getMemberIds().add(userId);
                        System.out.println("✅ Membre ajouté à la liste du sous-groupe");
                    }
                    
                    // ✅ Mettre à jour le rôle dans memberRoles
                    if (sg.getMemberRoles() == null) {
                        sg.setMemberRoles(new HashMap<>());
                    }
                    sg.getMemberRoles().put(userId, subGroupRole);
                    System.out.println("✅ Rôle du membre mis à jour dans memberRoles: " + subGroupRole);
                    
                    // ✅ Si RESPONSABLE, mettre à jour responsableId
                    if (subGroupRole.equals("RESPONSABLE")) {
                        sg.setResponsableId(userId);
                        System.out.println("✅ ResponsableId mis à jour: " + userId);
                    }
                });

        // ✅ Si RESPONSABLE, mettre à jour aussi dans le service User via REST API
        if (subGroupRole.equals("RESPONSABLE")) {
            System.out.println("🔍 Appel du service User pour mettre à jour le rôle...");
            System.out.println("📋 SubGroupRole reçu: '" + subGroupRole + "'");
            System.out.println("📋 Comparaison: subGroupRole.equals(\"RESPONSABLE\") = " + subGroupRole.equals("RESPONSABLE"));
            
            try {
                String newRole = "Responsable " + subGroup.getName();
                String url = userServiceUrl + "/" + userId + "/role";
                
                System.out.println("📡 URL complète: " + url);
                System.out.println("📦 Nouveau rôle: " + newRole);
                System.out.println("📦 UserId: " + userId);
                
                Map<String, String> roleUpdate = new HashMap<>();
                roleUpdate.put("role", newRole);
                
                System.out.println("📤 Envoi de la requête PUT...");
                
                HttpEntity<Map<String, String>> request = new HttpEntity<>(roleUpdate);
                ResponseEntity<String> response = restTemplate.exchange(
                    url,
                    HttpMethod.PUT,
                    request,
                    String.class
                );
                
                System.out.println("✅ Rôle mis à jour dans le service User: " + newRole);
                System.out.println("📡 Réponse: " + response.getStatusCode());
                System.out.println("📄 Body: " + response.getBody());
            } catch (Exception e) {
                System.err.println("❌ Erreur lors de la mise à jour du rôle dans User service: " + e.getMessage());
                e.printStackTrace();
            }
        } else {
            System.out.println("⚠️ SubGroupRole n'est PAS 'RESPONSABLE', c'est: '" + subGroupRole + "'");
        }

        Club savedClub = clubRepository.save(club);
        System.out.println("✅ Club sauvegardé");
        System.out.println("===================================");
        return savedClub;
    }

    public Club removeFromSubGroup(String clubId, String subGroupId, String userId) {
        Club club = clubRepository.findById(clubId)
                .orElseThrow(() -> new RuntimeException("Club non trouvé"));

        // Retirer l'userId de la liste memberIds du sous-groupe
        club.getSubGroups().stream()
                .filter(sg -> sg.getId().equals(subGroupId))
                .findFirst()
                .ifPresent(sg -> sg.getMemberIds().remove(userId));

        // ✅ Mettre à jour subGroupId ET subGroupRole du membre + restaurer le rôle initial
        club.getMembers().stream()
                .filter(m -> m.getUserId().equals(userId) && subGroupId.equals(m.getSubGroupId()))
                .findFirst()
                .ifPresent(m -> {
                    boolean wasResponsable = "RESPONSABLE".equals(m.getSubGroupRole());
                    String initialRole = m.getInitialRole();
                    
                    m.setSubGroupId(null);
                    m.setSubGroupRole(null);
                    
                    // ✅ Si c'était un responsable, restaurer son rôle initial via REST API
                    if (wasResponsable && initialRole != null) {
                        System.out.println("🔄 Restauration du rôle initial: " + initialRole);
                        m.setRole(initialRole);
                        m.setInitialRole(null);
                        
                        // ✅ Mettre à jour aussi dans le service User via REST API
                        try {
                            String url = userServiceUrl + "/" + userId + "/role";
                            
                            Map<String, String> roleUpdate = new HashMap<>();
                            roleUpdate.put("role", initialRole);
                            
                            HttpEntity<Map<String, String>> request = new HttpEntity<>(roleUpdate);
                            restTemplate.exchange(url, HttpMethod.PUT, request, String.class);
                            
                            System.out.println("✅ Rôle restauré dans le service User");
                        } catch (Exception e) {
                            System.err.println("❌ Erreur lors de la restauration du rôle: " + e.getMessage());
                        }
                    }
                });

        return clubRepository.save(club);
    }

    public SubGroupRecommendation recommendRole(String clubId, String userId) {
        Club club = clubRepository.findById(clubId)
                .orElseThrow(() -> new RuntimeException("Club non trouvé"));

        SubGroupRecommendation recommendation = new SubGroupRecommendation();

        if (club.getSubGroups() != null && !club.getSubGroups().isEmpty()) {
            SubGroup recommended = club.getSubGroups().get(0);
            recommendation.setSubGroupId(recommended.getId());
            recommendation.setSubGroupName(recommended.getName());
            recommendation.setReason("Basé sur vos centres d'intérêt");
        } else {
            recommendation.setSubGroupName("Général");
            recommendation.setReason("Aucun sous-groupe disponible");
        }

        recommendation.setSuggestedRole("MEMBER");
        return recommendation;
    }
    public Club updateSubGroup(String clubId, String subGroupId, SubGroup updatedSubGroup) {
        Club club = clubRepository.findById(clubId)
                .orElseThrow(() -> new RuntimeException("Club non trouvé"));

        club.getSubGroups().stream()
                .filter(sg -> sg.getId().equals(subGroupId))
                .findFirst()
                .ifPresent(sg -> {
                    if (updatedSubGroup.getName() != null) sg.setName(updatedSubGroup.getName());
                    if (updatedSubGroup.getDescription() != null) sg.setDescription(updatedSubGroup.getDescription());
                });

        return clubRepository.save(club);
    }
}