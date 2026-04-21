package esprit.com.clubhub.service;

import esprit.com.clubhub.entity.Candidate;
import esprit.com.clubhub.entity.Club;
import esprit.com.clubhub.entity.Election;
import esprit.com.clubhub.entity.Member;
import esprit.com.clubhub.entity.VotingCode;
import esprit.com.clubhub.entity.QRToken;
import esprit.com.clubhub.repository.ClubRepository;
import esprit.com.clubhub.repository.ElectionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ElectionSchedulerService {

    @Autowired
    private ElectionRepository electionRepository;

    @Autowired
    private ClubRepository clubRepository;

    @Autowired
    private GmailEmailService emailService;

    @Autowired
    private VotingCodeService votingCodeService;

    @Autowired
    private QRCodeService qrCodeService;

    @Autowired
    private QRTokenService qrTokenService;

    /**
     * Vérifie toutes les heures si des élections nécessitent:
     * 1. Fermeture des candidatures (J-1 avant startDate)
     * 2. Envoi d'email de rappel avec codes de vote
     * S'exécute toutes les heures
     */
@Scheduled(fixedDelay = 30000)  // Toutes les 30 secondes
    public void checkElectionReminders() {
        System.out.println("🔍 Vérification des rappels d'élection (J-1)...");
        
        List<Election> elections = electionRepository.findAll();
        LocalDateTime now = LocalDateTime.now();
        
        for (Election election : elections) {
            // Vérifier si l'élection est planifiée et que le rappel n'a pas été envoyé
            if (!"PLANNED".equals(election.getStatus())) {
                continue;
            }
            
            if (election.isReminderSent()) {
                continue;
            }
            
            if (election.getStartDate() == null) {
                continue;
            }
            
            // Calculer J-1 (24h avant le début de l'élection)
            LocalDateTime oneDayBefore = election.getStartDate().minusDays(1);
            
            // Si nous sommes passés J-1 et que le rappel n'a pas été envoyé
            if (now.isAfter(oneDayBefore) && now.isBefore(election.getStartDate())) {
                System.out.println("📅 Élection J-1 détectée: " + election.getTitle());
                System.out.println("   Date début: " + election.getStartDate());
                System.out.println("   J-1: " + oneDayBefore);
                System.out.println("   Maintenant: " + now);
                
                // Fermer les candidatures et envoyer le rappel
                closeCandidaciesAndSendReminder(election);
            }
        }
    }

    /**
     * Ferme les candidatures et envoie le rappel avec codes de vote
     */
    private void closeCandidaciesAndSendReminder(Election election) {
        try {
            System.out.println("🔒 Fermeture des candidatures pour: " + election.getTitle());
            
            // Marquer la deadline de candidature comme passée
            election.setCandidacyDeadline(LocalDateTime.now());
            
            sendElectionReminder(election);
            
        } catch (Exception e) {
            System.err.println("❌ Erreur lors de la fermeture des candidatures: " + e.getMessage());
            e.printStackTrace();
        }
    }

    /**
     * Envoie le rappel d'élection avec codes de vote
     */
    private void sendElectionReminder(Election election) {
        try {
            System.out.println("📧 Envoi du rappel pour l'élection: " + election.getTitle());
            
            // Récupérer le club depuis la base de données locale
            Club club = clubRepository.findById(election.getClubId()).orElse(null);
            
            if (club == null) {
                System.err.println("❌ Club non trouvé avec ID: " + election.getClubId());
                return;
            }
            
            System.out.println("✅ Club trouvé: " + club.getName());
            
            if (club.getMembers() == null || club.getMembers().isEmpty()) {
                System.out.println("⚠️ Aucun membre trouvé pour le club");
                return;
            }
            
            System.out.println("   Nombre de membres: " + club.getMembers().size());
            
            // Préparer les emails et noms
            Map<String, String> memberEmailsWithNames = new HashMap<>();
            Map<String, String> memberQRCodes = new HashMap<>(); // QR codes par email
            List<String> userIds = new ArrayList<>();
            List<String> emails = new ArrayList<>();
            
            for (Member member : club.getMembers()) {
                String email = member.getEmail();
                String name = member.getName();
                String userId = member.getUserId();
                String role = member.getRole();
                
                if (email != null && !email.isEmpty() && name != null) {
                    memberEmailsWithNames.put(email, name);
                    if (userId != null) {
                        userIds.add(userId);
                        
                        // Vérifier si le membre est candidat
                        boolean isCandidate = election.getCandidates().stream()
                            .anyMatch(c -> c.getUserId().equals(userId) && "APPROVED".equals(c.getStatus()));
                        
                        // ✅ NOUVEAU: Créer un QR token pour ce membre
                        QRToken qrToken = qrTokenService.createQRToken(
                            election.getId(),
                            userId,
                            email,
                            name,
                            role,
                            isCandidate,
                            null // photoUrl - à implémenter si disponible
                        );
                        
                        // Générer le QR code avec l'URL contenant le token
                        String qrCode = qrCodeService.generateElectionQRCodeWithUrl(qrToken.getToken());
                        
                        if (qrCode != null) {
                            memberQRCodes.put(email, qrCode);
                        }
                    }
                    emails.add(email);
                    System.out.println("   - " + name + " (" + email + ")");
                }
            }
            
            if (memberEmailsWithNames.isEmpty()) {
                System.out.println("⚠️ Aucun membre avec email valide trouvé");
                return;
            }
            
            // Générer les codes de vote pour élections présentielles
            if ("IN_PERSON".equals(election.getType())) {
                System.out.println("🔑 Génération des codes de vote pour élection présentielle...");
                List<VotingCode> votingCodes = votingCodeService.generateVotingCodes(userIds, emails);
                election.setVotingCodes(votingCodes);
                System.out.println("   ✅ " + votingCodes.size() + " codes générés");
            }
            
            // Grouper les candidats par comité
            Map<String, List<Candidate>> candidatesByCommittee = new HashMap<>();
            if (election.getCandidates() != null && !election.getCandidates().isEmpty()) {
                candidatesByCommittee = election.getCandidates().stream()
                    .filter(c -> "APPROVED".equals(c.getStatus()))
                    .collect(Collectors.groupingBy(
                        c -> c.getSubGroupTarget() != null ? c.getSubGroupTarget() : "Président",
                        Collectors.toList()
                    ));
                System.out.println("   📋 " + candidatesByCommittee.size() + " comité(s) avec candidats");
            }
            
            // Envoyer les emails
            System.out.println("📧 Envoi des emails de rappel à " + memberEmailsWithNames.size() + " membres...");
            
            // Préparer le lien Google Maps si localisation disponible
            String googleMapsLink = null;
            if (election.getLocation() != null) {
                googleMapsLink = qrCodeService.generateGoogleMapsLink(
                    election.getLocation().getLatitude(),
                    election.getLocation().getLongitude(),
                    election.getLocation().getPlaceName()
                );
                System.out.println("   📍 Lien Google Maps: " + googleMapsLink);
            }
            
            emailService.sendElectionReminderEmail(
                election, 
                memberEmailsWithNames,
                memberQRCodes,
                club.getName(),
                candidatesByCommittee,
                googleMapsLink
            );
            
            // Marquer le rappel comme envoyé
            election.setReminderSent(true);
            electionRepository.save(election);
            
            System.out.println("✅ Rappel envoyé avec succès");
            
        } catch (Exception e) {
            System.err.println("❌ Erreur lors de l'envoi du rappel: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
