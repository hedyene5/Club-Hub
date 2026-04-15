package esprit.com.clubhub.service;

import esprit.com.clubhub.dto.EligibilityResult;
import esprit.com.clubhub.entity.*;
import esprit.com.clubhub.repository.ElectionRepository;
import esprit.com.clubhub.repository.ClubRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
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
     * Élection bureau : met à jour subGroupRole du gagnant
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

            SubGroup targetSg = club.getSubGroups().stream()
                    .filter(sg -> sg.getName().equalsIgnoreCase(subGroupName) ||
                            subGroupName.toLowerCase().contains(sg.getName().toLowerCase()) ||
                            sg.getName().toLowerCase().contains(subGroupName.toLowerCase()))
                    .findFirst().orElse(null);

            String targetSgId = targetSg != null ? targetSg.getId() : null;

            club.getMembers().forEach(m -> {
                if (m.getUserId().equals(winnerId)) {
                    m.setSubGroupRole("RESPONSABLE");
                    if (targetSgId != null) m.setSubGroupId(targetSgId);
                    System.out.println("  ✅ " + m.getName() + " → RESPONSABLE " + subGroupName);
                } else if ("RESPONSABLE".equals(m.getSubGroupRole())
                        && targetSgId != null
                        && targetSgId.equals(m.getSubGroupId())) {
                    m.setSubGroupRole("MEMBRE");
                    System.out.println("  🔄 " + m.getName() + " → MEMBRE (ancien responsable)");
                }
            });
        });

        clubRepository.save(club);
        System.out.println("✅ Rôles bureau mis à jour");
    }

    public Election castVote(String electionId, Vote vote) {
        Election election = electionRepository.findById(electionId)
                .orElseThrow(() -> new RuntimeException("Élection non trouvée"));

        if (!election.getStatus().equals("OPEN")) {
            throw new RuntimeException("L'élection n'est pas ouverte");
        }

        boolean alreadyVoted = election.getVotes().stream()
                .anyMatch(v -> v.getVoterId().equals(vote.getVoterId()));

        if (alreadyVoted) {
            throw new RuntimeException("Vous avez déjà voté");
        }

        boolean candidateExists = election.getCandidates().stream()
                .anyMatch(c -> c.getUserId().equals(vote.getCandidateId())
                        && c.getStatus().equals("APPROVED"));

        if (!candidateExists) {
            throw new RuntimeException("Candidat invalide");
        }

        election.getVotes().add(vote);
        return electionRepository.save(election);
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
        return club.getSubGroups().stream()
                .filter(sg -> sg.getId().equals(subGroupId))
                .anyMatch(sg -> sg.getMemberIds() != null && sg.getMemberIds().contains(voterId))
                || club.getMembers().stream()
                .anyMatch(m -> m.getUserId().equals(voterId) && subGroupId.equals(m.getSubGroupId()));
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
}