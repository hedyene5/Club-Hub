package clubhub.service;

import clubhub.model.Reaction;
import clubhub.repository.ReactionRepository;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class ReactionService {

    private final ReactionRepository reactionRepository;

    public ReactionService(ReactionRepository reactionRepository) {
        this.reactionRepository = reactionRepository;
    }

    // Toggle: if same emoji exists → remove, else add/replace
    public List<Reaction> toggleReaction(String messageId, String userId, Reaction.EmojiType emoji) {
        Optional<Reaction> existing = reactionRepository.findByMessageIdAndUserId(messageId, userId);

        if (existing.isPresent()) {
            if (existing.get().getEmoji() == emoji) {
                // Same emoji → remove (toggle off)
                reactionRepository.delete(existing.get());
            } else {
                // Different emoji → replace
                existing.get().setEmoji(emoji);
                reactionRepository.save(existing.get());
            }
        } else {
            // No reaction yet → add
            reactionRepository.save(new Reaction(messageId, userId, emoji));
        }

        return reactionRepository.findByMessageId(messageId);
    }

    public List<Reaction> getReactions(String messageId) {
        return reactionRepository.findByMessageId(messageId);
    }
}