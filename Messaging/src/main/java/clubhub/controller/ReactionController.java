package clubhub.controller;

import clubhub.model.Reaction;
import clubhub.service.ReactionService;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController

@RequestMapping("/api/conversations/{conversationId}/messages/{messageId}/reactions")
public class ReactionController {

    private final ReactionService reactionService;
    private final SimpMessagingTemplate messagingTemplate;

    public ReactionController(ReactionService reactionService,
                              SimpMessagingTemplate messagingTemplate) {
        this.reactionService = reactionService;
        this.messagingTemplate = messagingTemplate;
    }

    // POST → toggle reaction
    @PostMapping
    public ResponseEntity<List<Reaction>> toggleReaction(
            @PathVariable String conversationId,
            @PathVariable String messageId,
            @RequestBody Map<String, String> body) {

        String userId = body.get("userId");
        Reaction.EmojiType emoji = Reaction.EmojiType.valueOf(body.get("emoji"));

        List<Reaction> updated = reactionService.toggleReaction(messageId, userId, emoji);

        // Broadcast updated reactions via WebSocket
        messagingTemplate.convertAndSend(
                "/topic/reactions/" + messageId,
                (Object) Map.of("messageId", messageId, "reactions", updated)
        );

        return ResponseEntity.ok(updated);
    }

    // GET → get all reactions for a message
    @GetMapping
    public ResponseEntity<List<Reaction>> getReactions(
            @PathVariable String conversationId,
            @PathVariable String messageId) {
        return ResponseEntity.ok(reactionService.getReactions(messageId));
    }
}