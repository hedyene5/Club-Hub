package esprit.com.clubhub.controller;

import esprit.com.clubhub.dto.EligibilityResult;
import esprit.com.clubhub.entity.Candidate;
import esprit.com.clubhub.entity.Election;
import esprit.com.clubhub.entity.ElectionResults;
import esprit.com.clubhub.entity.Vote;
import esprit.com.clubhub.entity.*;
import esprit.com.clubhub.service.ElectionService;
import esprit.com.clubhub.service.VotingCodeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/elections")
@CrossOrigin(origins = "http://localhost:4200")
public class ElectionController {

    @Autowired
    private ElectionService electionService;
    
    @Autowired
    private VotingCodeService votingCodeService;

    // ========== CRUD ==========

    @GetMapping
    public List<Election> getAllElections() {
        return electionService.getAllElections();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Election> getElectionById(@PathVariable String id) {
        return electionService.getElectionById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/club/{clubId}")
    public List<Election> getElectionsByClub(@PathVariable String clubId) {
        return electionService.getElectionsByClub(clubId);
    }

    @PostMapping
    public ResponseEntity<Election> createElection(@RequestBody Election election) {
        try {
            Election created = electionService.createElection(election);
            return new ResponseEntity<>(created, HttpStatus.CREATED);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Election> updateElection(@PathVariable String id, @RequestBody Election election) {
        try {
            System.out.println("=== PUT REÇU ===");
            System.out.println("ID: " + id);
            System.out.println("Candidates dans la requête: " +
                    (election.getCandidates() != null ? election.getCandidates().size() : 0));

            Election updated = electionService.updateElection(id, election);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            System.err.println("ERREUR PUT: " + e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteElection(@PathVariable String id) {
        electionService.deleteElection(id);
        return ResponseEntity.noContent().build();
    }

    // ========== Opérations spécifiques ==========

    @PostMapping("/{id}/start")
    public ResponseEntity<Election> startElection(@PathVariable String id) {
        try {
            Election election = electionService.startElection(id);
            return ResponseEntity.ok(election);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/{id}/close")
    public ResponseEntity<Election> closeElection(@PathVariable String id) {
        try {
            Election election = electionService.closeElection(id);
            return ResponseEntity.ok(election);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/{id}/votes")
    public ResponseEntity<Election> castVote(@PathVariable String id, @RequestBody Vote vote) {
        try {
            Election election = electionService.castVote(id, vote);
            return ResponseEntity.ok(election);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    @GetMapping("/{id}/results")
    public ResponseEntity<ElectionResults> getResults(@PathVariable String id) {
        return electionService.getElectionById(id)
                .map(election -> ResponseEntity.ok(election.getResults()))
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/candidates/{candidateId}/validate")
    public ResponseEntity<Election> validateCandidate(@PathVariable String id, @PathVariable String candidateId) {
        try {
            Election election = electionService.validateCandidate(id, candidateId);
            return ResponseEntity.ok(election);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // ========== Gestion des Candidats ==========

    @PostMapping("/{electionId}/candidates")
    public ResponseEntity<Election> addCandidate(
            @PathVariable String electionId,
            @RequestBody Candidate candidate) {
        try {
            System.out.println("========================================");
            System.out.println("➕ AJOUT CANDIDAT");
            System.out.println("Election ID: " + electionId);
            System.out.println("Candidat reçu: " + candidate.getUserId() + " - " + candidate.getName());

            Election election = electionService.getElectionById(electionId)
                    .orElseThrow(() -> new RuntimeException("Élection non trouvée"));

            System.out.println("Élection trouvée: " + election.getTitle());
            System.out.println("Candidats avant ajout: " + election.getCandidates().size());

            candidate.setStatus("PENDING");
            candidate.setApplicationDate(java.time.LocalDateTime.now());
            election.getCandidates().add(candidate);

            System.out.println("Candidats après ajout: " + election.getCandidates().size());

            Election updated = electionService.updateElection(electionId, election);

            System.out.println("✅ AJOUT RÉUSSI");
            System.out.println("========================================");
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            System.err.println("❌ ERREUR: " + e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/{electionId}/candidates")
    public ResponseEntity<List<Candidate>> getCandidates(@PathVariable String electionId) {
        return electionService.getElectionById(electionId)
                .map(election -> ResponseEntity.ok(election.getCandidates()))
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{electionId}/candidates/{candidateId}/reject")
    public ResponseEntity<Election> rejectCandidate(
            @PathVariable String electionId,
            @PathVariable String candidateId) {
        try {
            Election election = electionService.getElectionById(electionId)
                    .orElseThrow(() -> new RuntimeException("Élection non trouvée"));

            election.getCandidates().stream()
                    .filter(c -> c.getUserId().equals(candidateId))
                    .findFirst()
                    .ifPresent(c -> c.setStatus("REJECTED"));

            Election updated = electionService.updateElection(electionId, election);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{electionId}/candidates/{candidateId}")
    public ResponseEntity<Election> removeCandidate(
            @PathVariable String electionId,
            @PathVariable String candidateId) {
        try {
            Election election = electionService.getElectionById(electionId)
                    .orElseThrow(() -> new RuntimeException("Élection non trouvée"));

            election.getCandidates().removeIf(c -> c.getUserId().equals(candidateId));

            Election updated = electionService.updateElection(electionId, election);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // ========== NOUVELLES MÉTHODES ==========

    @PostMapping("/{id}/candidacy")
    public ResponseEntity<?> submitCandidacy(@PathVariable String id, @RequestBody Candidate candidate) {
        try {
            EligibilityResult result = electionService.submitCandidacy(id, candidate);
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/promote-winner")
    public ResponseEntity<?> promoteWinner(@PathVariable String id) {
        try {
            electionService.promoteWinnerToCEO(id);
            return ResponseEntity.ok(Map.of("message", "Le gagnant a été promu CEO"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{id}/eligibility-criteria")
    public ResponseEntity<?> getEligibilityCriteria(@PathVariable String id) {
        try {
            Map<String, Object> criteria = electionService.getEligibilityCriteria(id);
            return ResponseEntity.ok(criteria);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ✅ NOUVEAU: Obtenir les comités disponibles pour voter selon le mode
    @GetMapping("/{id}/available-committees/{userId}")
    public ResponseEntity<?> getAvailableCommittees(@PathVariable String id, @PathVariable String userId) {
        try {
            Map<String, Object> result = electionService.getAvailableCommitteesForVoting(id, userId);
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ✅ NOUVEAU: Voter avec code (pour élections présentielles)
    @PostMapping("/{id}/vote-with-code")
    public ResponseEntity<?> voteWithCode(
            @PathVariable String id, 
            @RequestBody Map<String, String> request) {
        try {
            String email = request.get("email");
            String code = request.get("code");
            String candidateId = request.get("candidateId");
            
            if (email == null || code == null || candidateId == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Email, code et candidateId requis"));
            }
            
            Election election = electionService.getElectionById(id)
                    .orElseThrow(() -> new RuntimeException("Élection non trouvée"));
            
            // Vérifier que c'est une élection présentielle
            if (!"IN_PERSON".equals(election.getType())) {
                return ResponseEntity.badRequest().body(Map.of("error", "Cette élection n'est pas présentielle"));
            }
            
            // Valider le code
            if (!votingCodeService.validateVotingCode(election.getVotingCodes(), email, code)) {
                return ResponseEntity.badRequest().body(Map.of("error", "Code invalide ou déjà utilisé"));
            }
            
            // Trouver l'userId correspondant à l'email
            VotingCode votingCode = election.getVotingCodes().stream()
                    .filter(vc -> vc.getEmail().equals(email) && vc.getCode().equals(code))
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException("Code non trouvé"));
            
            // Créer le vote
            Vote vote = new Vote();
            vote.setVoterId(votingCode.getUserId());
            vote.setCandidateId(candidateId);
            
            // Marquer le code comme utilisé
            votingCodeService.markCodeAsUsed(election.getVotingCodes(), email, code);
            
            // Enregistrer le vote
            Election updated = electionService.castVote(id, vote);
            
            return ResponseEntity.ok(Map.of(
                "message", "Vote enregistré avec succès",
                "election", updated
            ));
            
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Vérifier si les candidatures sont encore ouvertes pour une élection
     */
    @GetMapping("/{id}/candidacy-status")
    public ResponseEntity<Map<String, Object>> getCandidacyStatus(@PathVariable String id) {
        try {
            Election election = electionService.getElectionById(id)
                    .orElseThrow(() -> new RuntimeException("Élection non trouvée"));
            
            LocalDateTime now = LocalDateTime.now();
            boolean isOpen = election.getCandidacyDeadline() == null || now.isBefore(election.getCandidacyDeadline());
            
            Map<String, Object> response = new HashMap<>();
            response.put("isOpen", isOpen);
            response.put("candidacyDeadline", election.getCandidacyDeadline());
            response.put("startDate", election.getStartDate());
            
            if (!isOpen && election.getCandidacyDeadline() != null) {
                response.put("message", "Les candidatures sont fermées depuis le " + 
                    election.getCandidacyDeadline().format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy à HH:mm")));
            } else if (isOpen && election.getCandidacyDeadline() != null) {
                response.put("message", "Les candidatures sont ouvertes jusqu'au " + 
                    election.getCandidacyDeadline().format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy à HH:mm")));
            }
            
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * ✅ NOUVEAU: Voter avec token (après scannage QR code)
     * POST /api/elections/{id}/vote-with-token
     * Body: { "voterId": "...", "candidateId": "...", "token": "..." }
     */
    @PostMapping("/{id}/vote-with-token")
    public ResponseEntity<?> voteWithToken(
            @PathVariable String id,
            @RequestBody Map<String, String> request) {
        try {
            String voterId = request.get("voterId");
            String candidateId = request.get("candidateId");
            String token = request.get("token");
            String subGroupId = request.get("subGroupId"); // Optionnel pour élections de bureau

            if (voterId == null || candidateId == null || token == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "voterId, candidateId et token requis"));
            }

            // Créer le vote
            Vote vote = new Vote();
            vote.setVoterId(voterId);
            vote.setCandidateId(candidateId);
            if (subGroupId != null) {
                vote.setSubGroupId(subGroupId);
            }

            // Enregistrer le vote avec validation du token
            Election updated = electionService.castVoteWithToken(id, vote, token);

            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Vote enregistré avec succès",
                "election", updated
            ));

        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", e.getMessage()
            ));
        }
    }
}
