package esprit.com.instantvoicemanagment.controller;

import esprit.com.instantvoicemanagment.entity.Channel;
import esprit.com.instantvoicemanagment.service.ChannelService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.List;

@RestController
@RequestMapping("/api/channels")
@RequiredArgsConstructor
public class ChannelController {

    private final ChannelService channelService;
    private final RestTemplate restTemplate = new RestTemplate();

    // GET channels for a user
    @GetMapping
    public List<Channel> getChannels(
            @RequestParam(required = false) String userId,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String userPost) {
        if (userId != null && !userId.isEmpty()) {
            return channelService.getChannelsForUser(userId, role, userPost);
        }
        return channelService.getAllChannels();
    }

    // GET channel by ID
    @GetMapping("/{id}")
    public ResponseEntity<Channel> getChannelById(@PathVariable String id) {
        return ResponseEntity.ok(channelService.getChannelById(id));
    }

    // POST create channel
    @PostMapping
    public ResponseEntity<?> createChannel(
            @RequestBody Channel channel,
            @RequestParam(required = false) String userId,
            @RequestParam(required = false) String role) {
        try {
            return ResponseEntity.ok(channelService.createChannel(channel, userId, role));
        } catch (RuntimeException e) {
            return ResponseEntity.status(403).body(e.getMessage());
        }
    }

    // DELETE channel
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteChannel(@PathVariable String id) {
        channelService.deleteChannel(id);
        return ResponseEntity.noContent().build();
    }

    // POST add member to channel
    @PostMapping("/{id}/members/{memberId}")
    public ResponseEntity<Channel> addMember(
            @PathVariable String id,
            @PathVariable String memberId) {
        return ResponseEntity.ok(channelService.addMember(id, memberId));
    }

    // DELETE remove member from channel
    @DeleteMapping("/{id}/members/{memberId}")
    public ResponseEntity<?> removeMember(
            @PathVariable String id,
            @PathVariable String memberId) {
        try {
            java.util.Map<?, ?> user = restTemplate.getForObject(
                    "http://localhost:8081/api/users/" + memberId, java.util.Map.class);
            if (user != null && "PRESIDENT".equals(user.get("role"))) {
                return ResponseEntity.status(403).body("Cannot remove a PRESIDENT from a channel.");
            }
        } catch (Exception ignored) {
            // If the user service is unavailable, proceed (do not block)
        }
        return ResponseEntity.ok(channelService.removeMember(id, memberId));
    }

    // POST ensure a post channel exists and add a member to it
    @PostMapping("/post-channel/{postName}/{memberId}")
    public ResponseEntity<Channel> ensurePostChannel(
            @PathVariable String postName,
            @PathVariable String memberId) {
        return ResponseEntity.ok(channelService.ensurePostChannel(postName, memberId));
    }

    // DELETE remove a member from their old post channel
    @DeleteMapping("/post-channel/{postName}/{memberId}")
    public ResponseEntity<Void> removeFromPostChannel(
            @PathVariable String postName,
            @PathVariable String memberId) {
        channelService.removeFromPostChannel(postName, memberId);
        return ResponseEntity.noContent().build();
    }

    // POST sync member: remove from all wrong post channels, add to correct one
    @PostMapping("/post-channel/sync/{memberId}/{currentPost}")
    public ResponseEntity<Channel> syncMemberPostChannel(
            @PathVariable String memberId,
            @PathVariable String currentPost) {
        return ResponseEntity.ok(channelService.syncMemberPostChannel(memberId, currentPost));
    }
}