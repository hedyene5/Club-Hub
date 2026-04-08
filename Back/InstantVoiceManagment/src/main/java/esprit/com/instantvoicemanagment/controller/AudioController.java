package esprit.com.instantvoicemanagment.controller;

import esprit.com.instantvoicemanagment.entity.AudioMessage;
import esprit.com.instantvoicemanagment.repository.AudioMessageRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/channels")
@RequiredArgsConstructor
public class AudioController {

    private final AudioMessageRepo audioRepo;

    @PostMapping("/{channelId}/audio")
    public ResponseEntity<AudioMessage> saveAudio(
            @PathVariable String channelId,
            @RequestBody AudioMessage message) {
        message.setChannelId(channelId);
        message.setCreatedAt(LocalDateTime.now());
        return ResponseEntity.ok(audioRepo.save(message));
    }

    @GetMapping("/{channelId}/audio")
    public List<AudioMessage> getAudio(@PathVariable String channelId) {
        return audioRepo.findByChannelIdOrderByCreatedAtDesc(channelId);
    }
}
