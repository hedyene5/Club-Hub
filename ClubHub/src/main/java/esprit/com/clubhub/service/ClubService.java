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

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.time.LocalDateTime;

@Service
public class ClubService {

    @Autowired
    private ClubRepository clubRepository;
    private RestTemplate restTemplate;
    private String userServiceUrl = "http://localhost:8081/users";
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

    public Club assignToSubGroup(String clubId, String userId, String subGroupId) {
        Club club = clubRepository.findById(clubId)
                .orElseThrow(() -> new RuntimeException("Club non trouvé"));

        // Mettre à jour le membre
        club.getMembers().stream()
                .filter(m -> m.getUserId().equals(userId))
                .findFirst()
                .ifPresent(member -> member.setSubGroupId(subGroupId));

        // Ajouter le membre à la liste du sous-groupe
        club.getSubGroups().stream()
                .filter(sg -> sg.getId().equals(subGroupId))
                .findFirst()
                .ifPresent(sg -> sg.getMemberIds().add(userId));

        return clubRepository.save(club);
    }

    public Club removeFromSubGroup(String clubId, String subGroupId, String userId) {
        Club club = clubRepository.findById(clubId)
                .orElseThrow(() -> new RuntimeException("Club non trouvé"));

        // Retirer l'userId de la liste memberIds du sous-groupe
        club.getSubGroups().stream()
                .filter(sg -> sg.getId().equals(subGroupId))
                .findFirst()
                .ifPresent(sg -> sg.getMemberIds().remove(userId));

        // Mettre à jour subGroupId du membre si c'était ce sous-groupe
        club.getMembers().stream()
                .filter(m -> m.getUserId().equals(userId) && subGroupId.equals(m.getSubGroupId()))
                .findFirst()
                .ifPresent(m -> m.setSubGroupId(null));

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