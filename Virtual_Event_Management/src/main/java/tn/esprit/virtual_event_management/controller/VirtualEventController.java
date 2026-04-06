package tn.esprit.virtual_event_management.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.*;
import tn.esprit.virtual_event_management.entity.VirtualEvent;
import tn.esprit.virtual_event_management.service.IVirtualEventService;
import tn.esprit.virtual_event_management.service.VirtualEventService;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/virtual-events")
public class VirtualEventController {
    private final IVirtualEventService virtualEventService;

    public VirtualEventController(IVirtualEventService virtualEventService) {
        this.virtualEventService = virtualEventService;
    }

    @PostMapping
    public ResponseEntity<VirtualEvent> createEvent(@RequestBody VirtualEvent event) {

        // 🔥 empêcher injection du lien
        event.setMeetingLink(null);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(virtualEventService.createEvent(event));
    }

    @PutMapping("/{id}")
    public ResponseEntity<VirtualEvent> updateEvent(@PathVariable String id,
                                                    @RequestBody VirtualEvent event) {
        return ResponseEntity.ok(virtualEventService.updateEvent(id, event));
    }

    // 🔥 JOIN EVENT
    @PostMapping("/{id}/join")
    public ResponseEntity<VirtualEvent> joinEvent(@PathVariable String id) {
        return ResponseEntity.ok(
                ((VirtualEventService) virtualEventService).joinEvent(id)
        );
    }

    // 🔥 GET LINK DIRECT
    @GetMapping("/{id}/link")
    public ResponseEntity<String> getMeetingLink(@PathVariable String id) {
        return virtualEventService.getEventById(id)
                .map(e -> ResponseEntity.ok(e.getMeetingLink()))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}")
    public ResponseEntity<VirtualEvent> getEventById(@PathVariable String id) {
        return virtualEventService.getEventById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping
    public ResponseEntity<List<VirtualEvent>> getAllEvents() {
        return ResponseEntity.ok(virtualEventService.getAllEvents());
    }
}
