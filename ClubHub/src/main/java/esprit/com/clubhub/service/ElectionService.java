package esprit.com.clubhub.service;

import esprit.com.clubhub.dto.EligibilityResult;
import esprit.com.clubhub.entity.*;
import esprit.com.clubhub.repository.ElectionRepository;
import esprit.com.clubhub.repository.ClubRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class ElectionService {

    @Autowired
    private ElectionRepository electionRepository;

    @Autowired
    private ClubRepository clubRepository;

    @Autowired
    private EligibilityService eligibilityService;
    
    @Autowired
    private RestTemplate restTemplate;
    
    private String userServiceUrl = "http://localhost:8081/api/users";

    // ❌ SUPPRIMER cette ligne
    // @Autowired
    // private UserRepository userRepository;

    // ========== CRUD ==========

    public List<Election> getAllElections() {
        return electionRepository.findAll();
    }

    public Optional<Election> getElectionById(String id) {
        return electionRepository.findById(id);
    }

    public List<Election> getElectionsByClub(String clubId) {
        return electionRepository.findByClubId(clubId);
    }

    public Election createElection(Election election) {
        System.out.println("=== CREATE ELECTION ===");
        System.out.println("StartDate reçu: " + election.getStartDate());

        if (election.getStartDate() == null) {
            throw new RuntimeException("La date de début est requise");
        }
        if (election.getEndDate() == null) {
            throw new RuntimeException("La date de fin est requise");
        }

        if (election.getStartDate().isBefore(LocalDateTime.now().minusMinutes(1))) {
            throw new RuntimeException("La date de début doit être aujourd'hui ou dans le futur");
        }

        if (election.getPositions() == null) {
            election.setPositions(new ArrayList<>());
        }
        if (election.getCandidates() == null) {
            election.setCandidates(new ArrayList<>());
        }
        if (election.getVotes() == null) {
            election.setVotes(new ArrayList<>());
        }
        if (election.getStatus() == null) {
            election.setStatus("PLANNED");
        }
        if (election.getElectionType() == null) {
            election.setElectionType("PRESIDENT");
        }

        System.out.println("✅ Sauvegarde de l'élection...");
        Election saved = electionRepository.save(election);
        System.out.println("✅ Élection créée avec ID: " + saved.getId());
        return saved;
    }

    public Election updateElection(String id, Election electionDetails) {
        System.out.println("========================================");
        System.out.println("🔍 UPDATE ELECTION - DÉBUT");
        System.out.println("ID reçu: " + id);

        Election election = electionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Élection non trouvée"));

        if (electionDetails.getTitle() != null) election.setTitle(electionDetails.getTitle());
        if (electionDetails.getDescription() != null) election.setDescription(electionDetails.getDescription());
        if (electionDetails.getStartDate() != null) election.setStartDate(electionDetails.getStartDate());
        if (electionDetails.getEndDate() != null) election.setEndDate(electionDetails.getEndDate());
        if (electionDetails.getType() != null) election.setType(electionDetails.getType());
        if (electionDetails.getElectionType() != null) election.setElectionType(electionDetails.getElectionType());
        if (electionDetails.getPositions() != null) election.setPositions(electionDetails.getPositions());

        if (electionDetails.getCandidates() != null && !electionDetails.getCandidates().isEmpty()) {
            System.out.println("✅ Mise à jour des candidats...");
            election.setCandidates(electionDetails.getCandidates());
        } else {
            System.out.println("✅ Conservation des candidats existants: " + election.getCandidates().size());
        }

        if (electionDetails.getVotes() != null && !electionDetails.getVotes().isEmpty()) {
            election.setVotes(electionDetails.getVotes());
        }

        Election saved = electionRepository.save(election);
        System.out.println("🔍 UPDATE ELECTION - FIN");
        System.out.println("========================================");
        return saved;
    }

    public void deleteElection(String id) {
        electionRepository.deleteById(id);
    }

    // ========== Opérations spécifiques ==========

    public Election startElection(String id) {
        Election election = electionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Élection non trouvée"));

        if (!election.getStatus().equals("PLANNED")) {
            throw new RuntimeException("L'élection ne peut pas être démarrée");
        }

        election.setStatus("OPEN");
        return electionRepository.save(election);
    }

    public Election closeElection(String id) {
        Election election = electionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Élection non trouvée"));

        if (!election.getStatus().equals("OPEN")) {
            throw new RuntimeException("L'élection n'est pas ouverte");
        }

        election.setStatus("CLOSED");
        ElectionResults results = calculateResults(election);
        election.setResults(results);
        Election saved = electionRepository.save(election);

        if ("PRESIDENT".equals(election.getElectionType())) {
            applyPresidentRoleChange(saved);
        } else if ("BUREAU".equals(election.getElectionType())) {
            applyBureauRoleChange(saved);
        }

        return saved;
    }

    /**
     * Élection présidentielle : le gagnant devient PRESIDENT dans club.members
     */
    private void applyPresidentRoleChange(Election election) {
        if (election.getResults() == null || election.getResults().getWinnerId() == null) return;

        String winnerId = election.getResults().getWinnerId();
        Club club = clubRepository.findById(election.getClubId())
                .orElseThrow(() -> new RuntimeException("Club non trouvé"));

        Candidate winner = election.getCandidates().stream()
                .filter(c -> c.getUserId().equals(winnerId))
                .findFirst().orElse(null);
        if (winner == null) return;

        System.out.println("🏆 Gagnant élection présidentielle: " + winner.getName());

        // Mettre à jour les rôles dans club.members
        club.getMembers().forEach(m -> {
            if (m.getUserId().equals(winnerId)) {
                m.setRole("PRESIDENT");
            } else if ("PRESIDENT".equals(m.getRole())) {
                m.setRole("MEMBRE_SIMPLE");
            }
        });
        clubRepository.save(club);

        System.out.println("✅ Rôles mis à jour dans le club");
    }

    /**
     * Élection bureau : met à jour le responsable du comité
     * - Met à jour subGroupRole dans club.members
     * - Met à jour responsableId dans subGroup
     * - Met à jour memberRoles dans subGroup
     * - Met à jour le rôle dans la collection users via REST API
     */
    private void applyBureauRoleChange(Election election) {
        if (election.getResults() == null) return;

        Club club = clubRepository.findById(election.getClubId())
                .orElseThrow(() -> new RuntimeException("Club non trouvé"));

        Map<String, String> winnerBySubGroup = election.getResults().getWinnerBySubGroup();
        if (winnerBySubGroup == null || winnerBySubGroup.isEmpty()) {
            System.out.println("❌ Pas de winnerBySubGroup");
            return;
        }

        winnerBySubGroup.forEach((subGroupName, winnerId) -> {
            System.out.println("🏆 Comité '" + subGroupName + "' → gagnant: " + winnerId);

            // ✅ Trouver le sous-groupe correspondant
            SubGroup targetSg = club.getSubGroups().stream()
                    .filter(sg -> sg.getName().equalsIgnoreCase(subGroupName) ||
                            subGroupName.toLowerCase().contains(sg.getName().toLowerCase()) ||
                            sg.getName().toLowerCase().contains(subGroupName.toLowerCase()))
                    .findFirst().orElse(null);

            if (targetSg == null) {
                System.err.println("❌ Sous-groupe '" + subGroupName + "' non trouvé");
                return;
            }

            String targetSgId = targetSg.getId();
            String oldResponsableId = targetSg.getResponsableId();

            // ✅ ÉTAPE 1: Mettre à jour l'ancien responsable (s'il existe)
            if (oldResponsableId != null && !oldResponsableId.equals(winnerId)) {
                club.getMembers().stream()
                        .filter(m -> m.getUserId().equals(oldResponsableId))
                        .findFirst()
                        .ifPresent(oldResponsable -> {
                            // Changer son rôle de comité
                            oldResponsable.setSubGroupRole("MEMBRE_COMITE");
                            System.out.println("  🔄 Ancien responsable " + oldResponsable.getName() + " → MEMBRE_COMITE");
                            
                            // Restaurer son rôle initial s'il existe
                            String restoredRole = oldResponsable.getInitialRole();
                            if (restoredRole != null) {
                                oldResponsable.setRole(restoredRole);
                                oldResponsable.setInitialRole(null);
                                System.out.println("  🔄 Rôle restauré: " + restoredRole);
                                
                                // ✅ Mettre à jour dans la collection users via REST API
                                try {
                                    String url = userServiceUrl + "/" + oldResponsableId + "/role";
                                    Map<String, String> roleUpdate = new HashMap<>();
                                    roleUpdate.put("role", restoredRole);
                                    
                                    HttpEntity<Map<String, String>> request = new HttpEntity<>(roleUpdate);
                                    restTemplate.exchange(url, HttpMethod.PUT, request, String.class);
                                    
                                    System.out.println("  ✅ Rôle restauré dans User Service: " + restoredRole);
                                } catch (Exception e) {
                                    System.err.println("  ❌ Erreur mise à jour User Service: " + e.getMessage());
                                }
                            }
                        });
                
                // Mettre à jour memberRoles pour l'ancien responsable
                if (targetSg.getMemberRoles() != null) {
                    targetSg.getMemberRoles().put(oldResponsableId, "MEMBRE_COMITE");
                }
            }

            // ✅ ÉTAPE 2: Retirer le gagnant de TOUS les autres comités
            // Un responsable ne peut appartenir qu'à SON comité (RÈGLE 3)
            System.out.println("  🔍 Vérification des autres comités pour le gagnant...");
            
            club.getSubGroups().stream()
                    .filter(sg -> !sg.getId().equals(targetSgId))  // Tous les comités SAUF le comité cible
                    .forEach(otherSg -> {
                        // Retirer de la liste memberIds
                        if (otherSg.getMemberIds().contains(winnerId)) {
                            otherSg.getMemberIds().remove(winnerId);
                            System.out.println("  🔄 Gagnant retiré du comité '" + otherSg.getName() + "' (memberIds)");
                        }
                        
                        // Retirer de memberRoles
                        if (otherSg.getMemberRoles() != null && otherSg.getMemberRoles().containsKey(winnerId)) {
                            otherSg.getMemberRoles().remove(winnerId);
                            System.out.println("  🔄 Gagnant retiré du comité '" + otherSg.getName() + "' (memberRoles)");
                        }
                        
                        // Si le gagnant était responsable de cet autre comité, retirer responsableId
                        if (winnerId.equals(otherSg.getResponsableId())) {
                            otherSg.setResponsableId(null);
                            System.out.println("  🔄 Gagnant n'est plus responsable du comité '" + otherSg.getName() + "'");
                        }
                    });

            // ✅ ÉTAPE 3: Mettre à jour le nouveau responsable
            club.getMembers().stream()
                    .filter(m -> m.getUserId().equals(winnerId))
                    .findFirst()
                    .ifPresent(winner -> {
                        // Sauvegarder le rôle initial si c'est la première fois
                        if (winner.getInitialRole() == null) {
                            winner.setInitialRole(winner.getRole());
                            System.out.println("  📝 Rôle initial sauvegardé: " + winner.getRole());
                        }
                        
                        // Mettre à jour les champs du membre
                        winner.setSubGroupId(targetSgId);
                        winner.setSubGroupRole("RESPONSABLE");
                        String newRole = "Responsable " + targetSg.getName();
                        winner.setRole(newRole);
                        System.out.println("  ✅ " + winner.getName() + " → RESPONSABLE " + subGroupName);
                        
                        // ✅ Mettre à jour dans la collection users via REST API
                        try {
                            String url = userServiceUrl + "/" + winnerId + "/role";
                            Map<String, String> roleUpdate = new HashMap<>();
                            roleUpdate.put("role", newRole);
                            
                            HttpEntity<Map<String, String>> request = new HttpEntity<>(roleUpdate);
                            ResponseEntity<String> response = restTemplate.exchange(
                                url, 
                                HttpMethod.PUT, 
                                request, 
                                String.class
                            );
                            
                            System.out.println("  ✅ Rôle mis à jour dans User Service: " + newRole);
                            System.out.println("  📡 Réponse: " + response.getStatusCode());
                        } catch (Exception e) {
                            System.err.println("  ❌ Erreur mise à jour User Service: " + e.getMessage());
                            e.printStackTrace();
                        }
                    });

            // ✅ ÉTAPE 4: Mettre à jour le sous-groupe cible
            targetSg.setResponsableId(winnerId);
            
            // Ajouter le gagnant à la liste des membres s'il n'y est pas
            if (!targetSg.getMemberIds().contains(winnerId)) {
                targetSg.getMemberIds().add(winnerId);
                System.out.println("  ✅ Gagnant ajouté à la liste des membres du comité");
            }
            
            // Mettre à jour memberRoles
            if (targetSg.getMemberRoles() == null) {
                targetSg.setMemberRoles(new HashMap<>());
            }
            targetSg.getMemberRoles().put(winnerId, "RESPONSABLE");
            
            System.out.println("  ✅ SubGroup mis à jour: responsableId=" + winnerId);
        });

        // ✅ ÉTAPE 5: Sauvegarder le club
        clubRepository.save(club);
        System.out.println("✅ Rôles bureau mis à jour dans la base de données");
    }

    public Election castVote(String electionId, Vote vote) {
        System.out.println("=== CAST VOTE ===");
        System.out.println("ElectionId: " + electionId);
        System.out.println("VoterId: " + vote.getVoterId());
        System.out.println("CandidateId: " + vote.getCandidateId());
        System.out.println("SubGroupId: " + vote.getSubGroupId());
        
        Election election = electionRepository.findById(electionId)
                .orElseThrow(() -> new RuntimeException("Élection non trouvée"));

        if (!election.getStatus().equals("OPEN")) {
            throw new RuntimeException("L'élection n'est pas ouverte");
        }

        // ✅ Récupérer le club pour vérifier les permissions
        Club club = clubRepository.findById(election.getClubId())
                .orElseThrow(() -> new RuntimeException("Club non trouvé"));

        // ✅ Vérifier que le voteur est membre du club OU président
        Member voter = club.getMembers().stream()
                .filter(m -> m.getUserId().equals(vote.getVoterId()))
                .findFirst()
                .orElse(null);

        if (voter == null) {
            throw new RuntimeException("Vous devez être membre du club pour voter");
        }

        // Le président peut toujours voter, les autres doivent être APPROVED
        boolean canVote = "PRESIDENT".equals(voter.getRole()) || "APPROVED".equals(voter.getStatus());
        if (!canVote) {
            throw new RuntimeException("Votre adhésion doit être approuvée pour voter");
        }

        System.out.println("Voteur: " + voter.getName() + " (Rôle: " + voter.getRole() + ", Status: " + voter.getStatus() + ")");

        // ✅ Trouver le candidat pour obtenir son subGroupTarget
        Candidate candidate = election.getCandidates().stream()
                .filter(c -> c.getUserId().equals(vote.getCandidateId()) && "APPROVED".equals(c.getStatus()))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Candidat invalide ou non approuvé"));

        String subGroupTarget = candidate.getSubGroupTarget();
        
        // ✅ Trouver le subGroupId correspondant
        String subGroupId = findSubGroupId(club, subGroupTarget);
        if (subGroupId == null && election.getElectionType().equals("BUREAU")) {
            throw new RuntimeException("Comité non trouvé pour ce candidat");
        }
        
        // ✅ Définir le subGroupId dans le vote
        vote.setSubGroupId(subGroupId);

        // ✅ VALIDATION SELON LE MODE DE VOTE
        VotingMode votingMode = election.getVotingMode();
        if (votingMode == null) {
            // Par défaut: ALL_CLUB_MEMBERS pour compatibilité
            votingMode = VotingMode.ALL_CLUB_MEMBERS;
        }

        System.out.println("Mode de vote: " + votingMode);

        if (election.getElectionType().equals("BUREAU")) {
            if (votingMode == VotingMode.COMMITTEE_MEMBERS_ONLY) {
                // ✅ OPTION 2: Seuls les membres du comité peuvent voter POUR LEUR PROPRE COMITÉ
                // EXCEPTION: Le président peut voter pour tous les comités
                boolean isPresident = "PRESIDENT".equals(voter.getRole());
                boolean isInSubGroup = isVoterInSubGroup(club, vote.getVoterId(), subGroupId);
                
                if (!isPresident && !isInSubGroup) {
                    throw new RuntimeException("Vous ne pouvez voter que pour votre propre comité. Vous n'êtes pas membre du comité '" + subGroupTarget + "'");
                }
                
                // Vérifier si le voteur a déjà voté pour CE comité
                boolean alreadyVotedForThisSubGroup = election.getVotes().stream()
                        .anyMatch(v -> v.getVoterId().equals(vote.getVoterId()) 
                                && subGroupId.equals(v.getSubGroupId()));
                
                if (alreadyVotedForThisSubGroup) {
                    throw new RuntimeException("Vous avez déjà voté pour le comité '" + subGroupTarget + "'");
                }
                
                String voteReason = isPresident ? "président" : "membre du comité " + subGroupTarget;
                System.out.println("✅ Vote autorisé (COMMITTEE_MEMBERS_ONLY): " + voteReason);
                
            } else {
                // ✅ OPTION 1: Tous les membres du club peuvent voter
                // Vérifier si le voteur a déjà voté pour CE comité
                boolean alreadyVotedForThisSubGroup = election.getVotes().stream()
                        .anyMatch(v -> v.getVoterId().equals(vote.getVoterId()) 
                                && subGroupId.equals(v.getSubGroupId()));
                
                if (alreadyVotedForThisSubGroup) {
                    throw new RuntimeException("Vous avez déjà voté pour le comité '" + subGroupTarget + "'");
                }
                
                System.out.println("✅ Vote autorisé (ALL_CLUB_MEMBERS): membre du club");
            }
        } else {
            // Élection présidentielle: un seul vote par personne
            boolean alreadyVoted = election.getVotes().stream()
                    .anyMatch(v -> v.getVoterId().equals(vote.getVoterId()));
            
            if (alreadyVoted) {
                throw new RuntimeException("Vous avez déjà voté");
            }
        }

        election.getVotes().add(vote);
        Election saved = electionRepository.save(election);
        System.out.println("✅ Vote enregistré");
        System.out.println("=================");
        return saved;
    }

    private String findSubGroupId(Club club, String subGroupTarget) {
        if (subGroupTarget == null) return null;
        return club.getSubGroups().stream()
                .filter(sg -> sg.getName().equalsIgnoreCase(subGroupTarget) ||
                        subGroupTarget.toLowerCase().contains(sg.getName().toLowerCase()) ||
                        sg.getName().toLowerCase().contains(subGroupTarget.toLowerCase()))
                .map(SubGroup::getId)
                .findFirst().orElse(null);
    }

    private boolean isVoterInSubGroup(Club club, String voterId, String subGroupId) {
        // ✅ FIX: Vérifier UNIQUEMENT dans subGroup.memberIds
        // La source de vérité pour savoir si un membre est dans un comité est subGroup.memberIds
        return club.getSubGroups().stream()
                .filter(sg -> sg.getId().equals(subGroupId))
                .anyMatch(sg -> sg.getMemberIds() != null && sg.getMemberIds().contains(voterId));
    }

    public ElectionResults calculateResults(Election election) {
        Map<String, Integer> voteCount = new HashMap<>();

        for (Vote vote : election.getVotes()) {
            voteCount.put(vote.getCandidateId(),
                    voteCount.getOrDefault(vote.getCandidateId(), 0) + 1);
        }

        String winnerId = null;
        int maxVotes = 0;
        for (Map.Entry<String, Integer> entry : voteCount.entrySet()) {
            if (entry.getValue() > maxVotes) {
                maxVotes = entry.getValue();
                winnerId = entry.getKey();
            }
        }

        ElectionResults results = new ElectionResults();
        results.setTotalVotes(election.getVotes().size());
        results.setVoteCount(voteCount);
        results.setWinnerId(winnerId);
        results.setCalculatedAt(LocalDateTime.now());

        if ("BUREAU".equals(election.getElectionType())) {
            Map<String, String> winnerBySubGroup = new HashMap<>();
            Map<String, Integer> maxVotesBySubGroup = new HashMap<>();

            for (Candidate c : election.getCandidates()) {
                if (!"APPROVED".equals(c.getStatus())) continue;
                String sg = c.getSubGroupTarget();
                if (sg == null) continue;
                int votes = voteCount.getOrDefault(c.getUserId(), 0);
                if (votes > maxVotesBySubGroup.getOrDefault(sg, -1)) {
                    maxVotesBySubGroup.put(sg, votes);
                    winnerBySubGroup.put(sg, c.getUserId());
                }
            }
            results.setWinnerBySubGroup(winnerBySubGroup);
            System.out.println("🏆 Gagnants par comité: " + winnerBySubGroup);
        }

        election.setResults(results);
        electionRepository.save(election);
        return results;
    }

    public Election validateCandidate(String electionId, String candidateId) {
        Election election = electionRepository.findById(electionId)
                .orElseThrow(() -> new RuntimeException("Élection non trouvée"));

        election.getCandidates().stream()
                .filter(c -> c.getUserId().equals(candidateId))
                .findFirst()
                .ifPresent(c -> c.setStatus("APPROVED"));

        return electionRepository.save(election);
    }

    // ========== NOUVELLES MÉTHODES ==========

    public EligibilityResult submitCandidacy(String electionId, Candidate candidate) {
        Election election = electionRepository.findById(electionId)
                .orElseThrow(() -> new RuntimeException("Élection non trouvée"));

        EligibilityResult result;

        if (election.getElectionType() != null && election.getElectionType().equals("PRESIDENT")) {
            result = eligibilityService.checkPresidentEligibility(election.getClubId(), candidate.getUserId(), candidate);
        } else {
            result = eligibilityService.checkBureauEligibility(election.getClubId(), candidate.getUserId(), candidate);
        }

        if (result.isEligible()) {
            candidate.setStatus("PENDING");
            candidate.setApplicationDate(LocalDateTime.now());
            election.getCandidates().add(candidate);
            electionRepository.save(election);
            result.addReason("✅ Candidature soumise avec succès ! En attente de validation par le CEO.");
        }

        return result;
    }

    public void promoteWinnerToCEO(String electionId) {
        Election election = electionRepository.findById(electionId)
                .orElseThrow(() -> new RuntimeException("Élection non trouvée"));

        if (election.getElectionType() == null || !election.getElectionType().equals("PRESIDENT")) {
            throw new RuntimeException("Cette fonction n'est disponible que pour les élections présidentielles");
        }

        if (election.getStatus().equals("CLOSED") && election.getResults() != null) {
            String winnerId = election.getResults().getWinnerId();

            Candidate winner = election.getCandidates().stream()
                    .filter(c -> c.getUserId().equals(winnerId))
                    .findFirst()
                    .orElse(null);

            if (winner != null) {
                Club club = clubRepository.findById(election.getClubId())
                        .orElseThrow(() -> new RuntimeException("Club non trouvé"));

                club.getMembers().stream()
                        .filter(m -> m.getUserId().equals(winnerId))
                        .findFirst()
                        .ifPresent(member -> {
                            member.setRole("CEO");
                            System.out.println("✅ " + winner.getName() + " est maintenant CEO du club");
                        });

                club.getMembers().stream()
                        .filter(m -> m.getRole().equals("CEO") && !m.getUserId().equals(winnerId))
                        .findFirst()
                        .ifPresent(member -> {
                            member.setRole("MEMBER");
                            System.out.println("🔄 L'ancien CEO est maintenant membre");
                        });

                clubRepository.save(club);
            }
        }
    }

    public Map<String, Object> getEligibilityCriteria(String electionId) {
        Election election = electionRepository.findById(electionId)
                .orElseThrow(() -> new RuntimeException("Élection non trouvée"));

        Map<String, Object> criteria = new HashMap<>();
        criteria.put("electionType", election.getElectionType());

        if (election.getElectionType() != null && election.getElectionType().equals("PRESIDENT")) {
            criteria.put("minYearsInClub", 1);
            criteria.put("mustBeActive", true);
            criteria.put("mustBeApproved", true);
            criteria.put("description", "Pour être candidat à la présidence, vous devez :\n" +
                    "✓ Être membre approuvé du club\n" +
                    "✓ Avoir au moins 1 an d'ancienneté\n" +
                    "✓ Être un membre actif");
        } else {
            criteria.put("mustBeActive", true);
            criteria.put("mustBeApproved", true);
            criteria.put("mustBeInSubGroup", true);
            criteria.put("description", "Pour être candidat au bureau, vous devez :\n" +
                    "✓ Être membre approuvé du club\n" +
                    "✓ Être un membre actif\n" +
                    "✓ Appartenir au sous-groupe pour lequel vous postulez");
        }

        return criteria;
    }

    /**
     * ✅ NOUVEAU: Obtenir les comités disponibles pour voter selon le mode
     */
    public Map<String, Object> getAvailableCommitteesForVoting(String electionId, String userId) {
        Election election = electionRepository.findById(electionId)
                .orElseThrow(() -> new RuntimeException("Élection non trouvée"));
        
        Club club = clubRepository.findById(election.getClubId())
                .orElseThrow(() -> new RuntimeException("Club non trouvé"));
        
        Map<String, Object> result = new HashMap<>();
        result.put("votingMode", election.getVotingMode() != null ? election.getVotingMode() : VotingMode.ALL_CLUB_MEMBERS);
        
        // Trouver le membre
        Member member = club.getMembers().stream()
                .filter(m -> m.getUserId().equals(userId))
                .findFirst()
                .orElse(null);

        if (member == null) {
            result.put("canVote", false);
            result.put("reason", "Vous devez être membre du club");
            result.put("availableCommittees", new ArrayList<>());
            return result;
        }

        // Le président peut toujours voter, les autres doivent être APPROVED
        boolean canVote = "PRESIDENT".equals(member.getRole()) || "APPROVED".equals(member.getStatus());
        if (!canVote) {
            result.put("canVote", false);
            result.put("reason", "Votre adhésion doit être approuvée pour voter");
            result.put("availableCommittees", new ArrayList<>());
            return result;
        }

        System.out.println("Membre: " + member.getName() + " (Rôle: " + member.getRole() + ") peut voter");
        
        result.put("canVote", true);
        
        VotingMode votingMode = election.getVotingMode() != null ? election.getVotingMode() : VotingMode.ALL_CLUB_MEMBERS;
        
        // Grouper les candidats par comité
        Map<String, List<Candidate>> candidatesByCommittee = new HashMap<>();
        for (Candidate candidate : election.getCandidates()) {
            if ("APPROVED".equals(candidate.getStatus())) {
                String committee = candidate.getSubGroupTarget();
                candidatesByCommittee.computeIfAbsent(committee, k -> new ArrayList<>()).add(candidate);
            }
        }
        
        List<Map<String, Object>> availableCommittees = new ArrayList<>();
        
        for (Map.Entry<String, List<Candidate>> entry : candidatesByCommittee.entrySet()) {
            String committeeName = entry.getKey();
            List<Candidate> candidates = entry.getValue();
            
            // Trouver le subGroupId
            String subGroupId = findSubGroupId(club, committeeName);
            
            if (subGroupId == null) continue;
            
            // Vérifier si l'utilisateur peut voter pour ce comité
            boolean canVoteForThisCommittee = false;
            String reason = "";
            
            if (votingMode == VotingMode.ALL_CLUB_MEMBERS) {
                // OPTION 1: Tous les membres peuvent voter
                // Vérifier si l'utilisateur a déjà voté pour ce comité
                boolean alreadyVoted = election.getVotes().stream()
                        .anyMatch(v -> v.getVoterId().equals(userId) && subGroupId.equals(v.getSubGroupId()));
                
                if (alreadyVoted) {
                    canVoteForThisCommittee = false;
                    reason = "Vous avez déjà voté pour ce comité";
                } else {
                    canVoteForThisCommittee = true;
                    reason = "Vous pouvez voter (tous les membres du club)";
                }
            } else {
                // OPTION 2: Seuls les membres du comité peuvent voter
                // EXCEPTION: Le président peut voter pour tous les comités
                boolean isPresident = "PRESIDENT".equals(member.getRole());
                boolean isInSubGroup = isVoterInSubGroup(club, userId, subGroupId);
                
                if (!isPresident && !isInSubGroup) {
                    canVoteForThisCommittee = false;
                    reason = "Vous devez être membre de ce comité";
                } else {
                    // Vérifier si l'utilisateur a déjà voté pour ce comité
                    boolean alreadyVoted = election.getVotes().stream()
                            .anyMatch(v -> v.getVoterId().equals(userId) && subGroupId.equals(v.getSubGroupId()));
                    
                    if (alreadyVoted) {
                        canVoteForThisCommittee = false;
                        reason = "Vous avez déjà voté pour ce comité";
                    } else {
                        canVoteForThisCommittee = true;
                        reason = isPresident ? "Vous pouvez voter (président)" : "Vous pouvez voter (membre du comité)";
                    }
                }
            }
            
            Map<String, Object> committeeInfo = new HashMap<>();
            committeeInfo.put("committeeName", committeeName);
            committeeInfo.put("subGroupId", subGroupId);
            committeeInfo.put("candidates", candidates);
            committeeInfo.put("canVote", canVoteForThisCommittee);
            committeeInfo.put("reason", reason);
            
            availableCommittees.add(committeeInfo);
        }
        
        result.put("availableCommittees", availableCommittees);
        
        return result;
    }
}
