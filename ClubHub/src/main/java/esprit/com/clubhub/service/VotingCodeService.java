package esprit.com.clubhub.service;

import esprit.com.clubhub.entity.VotingCode;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.List;

@Service
public class VotingCodeService {

    private static final SecureRandom random = new SecureRandom();

    /**
     * Génère un code unique à 8 chiffres
     */
    public String generateUniqueCode() {
        int code = 10000000 + random.nextInt(90000000);
        return String.valueOf(code);
    }

    /**
     * Génère des codes de vote pour tous les membres
     */
    public List<VotingCode> generateVotingCodes(List<String> userIds, List<String> emails) {
        List<VotingCode> votingCodes = new ArrayList<>();
        
        for (int i = 0; i < userIds.size(); i++) {
            String userId = userIds.get(i);
            String email = emails.get(i);
            String code = generateUniqueCode();
            
            votingCodes.add(new VotingCode(userId, email, code));
        }
        
        return votingCodes;
    }

    /**
     * Valide un code de vote
     */
    public boolean validateVotingCode(List<VotingCode> votingCodes, String email, String code) {
        return votingCodes.stream()
            .anyMatch(vc -> vc.getEmail().equals(email) && 
                           vc.getCode().equals(code) && 
                           !vc.isUsed());
    }

    /**
     * Marque un code comme utilisé
     */
    public void markCodeAsUsed(List<VotingCode> votingCodes, String email, String code) {
        votingCodes.stream()
            .filter(vc -> vc.getEmail().equals(email) && vc.getCode().equals(code))
            .findFirst()
            .ifPresent(vc -> {
                vc.setUsed(true);
                vc.setUsedAt(java.time.LocalDateTime.now());
            });
    }
}
