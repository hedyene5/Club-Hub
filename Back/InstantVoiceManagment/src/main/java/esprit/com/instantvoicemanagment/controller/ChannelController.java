package esprit.com.instantvoicemanagment.controller;

import esprit.com.instantvoicemanagment.entity.Channel;
import esprit.com.instantvoicemanagment.service.ChannelService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/channels")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200", allowCredentials = "true")
public class ChannelController {

    private final ChannelService channelService;

    // GET all channels
    @GetMapping
    public List<Channel> getAllChannels() {
        return channelService.getAllChannels();
    }

    // GET channel by ID
    @GetMapping("/{id}")
    public ResponseEntity<Channel> getChannelById(@PathVariable String id) {
        return ResponseEntity.ok(channelService.getChannelById(id));
    }

    // POST create channel
    @PostMapping
    public ResponseEntity<Channel> createChannel(@RequestBody Channel channel) {
        return ResponseEntity.ok(channelService.createChannel(channel));
    }

    // DELETE channel
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteChannel(@PathVariable String id) {
        channelService.deleteChannel(id);
        return ResponseEntity.noContent().build();
    }

    // POST add sub-channel
    @PostMapping("/{id}/sub-channels")
    public ResponseEntity<Channel> addSubChannel(
            @PathVariable String id,
            @RequestBody Channel.SubChannel subChannel) {
        return ResponseEntity.ok(channelService.addSubChannel(id, subChannel));
    }

    // DELETE sub-channel
    @DeleteMapping("/{id}/sub-channels/{subId}")
    public ResponseEntity<Channel> deleteSubChannel(
            @PathVariable String id,
            @PathVariable String subId) {
        return ResponseEntity.ok(channelService.deleteSubChannel(id, subId));
    }
}