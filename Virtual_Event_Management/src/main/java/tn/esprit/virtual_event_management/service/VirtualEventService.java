package tn.esprit.virtual_event_management.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import tn.esprit.virtual_event_management.entity.VirtualEvent;
import tn.esprit.virtual_event_management.repository.VirtualEventRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service

public class VirtualEventService implements IVirtualEventService {
    private final VirtualEventRepository virtualEventRepository;

    public VirtualEventService(VirtualEventRepository virtualEventRepository) {
        this.virtualEventRepository = virtualEventRepository;
    }


    private String generateMeetingLink() {
        String roomId = "event-" + UUID.randomUUID().toString().substring(0, 8);
        return "https://meet.jit.si/" + roomId;
    }

    @Override
    public VirtualEvent createEvent(VirtualEvent event) {

        // Lien Jitsi auto seulement si le client n'en a pas fourni un (ex. calendrier Angular).
        if (event.getMeetingLink() == null || event.getMeetingLink().isBlank()) {
            event.setMeetingLink(generateMeetingLink());
        }

        event.setCreatedAt(LocalDateTime.now());
        event.setCurrentParticipants(0);

        if (event.getStatus() == null) {
            event.setStatus("UPCOMING");
        }

        if (event.getIsPaid() == null) {
            event.setIsPaid(false);
        }
        if (event.getIsRecording() == null) {
            event.setIsRecording(false);
        }

        return virtualEventRepository.save(event);
    }

    @Override
    public VirtualEvent updateEvent(String id, VirtualEvent updatedEvent) {

        VirtualEvent existing = virtualEventRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Event not found"));

        existing.setTitle(updatedEvent.getTitle());
        existing.setDescription(updatedEvent.getDescription());
        existing.setCategory(updatedEvent.getCategory());
        existing.setScheduledAt(updatedEvent.getScheduledAt());
        existing.setEndAt(updatedEvent.getEndAt());
        existing.setPrice(updatedEvent.getPrice());
        existing.setIsPaid(updatedEvent.getIsPaid());
        existing.setMaxParticipants(updatedEvent.getMaxParticipants());
        existing.setImageUrl(updatedEvent.getImageUrl());
        existing.setStatus(updatedEvent.getStatus());
        existing.setOrganizer(updatedEvent.getOrganizer());
        existing.setType(updatedEvent.getType());
        existing.setRoomId(updatedEvent.getRoomId());
        if (updatedEvent.getIsRecording() != null) {
            existing.setIsRecording(updatedEvent.getIsRecording());
        }
        if (updatedEvent.getMeetingLink() != null && !updatedEvent.getMeetingLink().isBlank()) {
            existing.setMeetingLink(updatedEvent.getMeetingLink());
        }

        existing.setCurrentParticipants(updatedEvent.getCurrentParticipants());

        return virtualEventRepository.save(existing);
    }

    // 🔥 JOIN EVENT (important)
    @Override
    public VirtualEvent joinEvent(String eventId) {

        VirtualEvent event = virtualEventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found"));

        if (event.getCurrentParticipants() == null) {
            event.setCurrentParticipants(0);
        }

        if (event.getMaxParticipants() != null &&
                event.getCurrentParticipants() >= event.getMaxParticipants()) {
            throw new RuntimeException("Event is full");
        }

        event.setCurrentParticipants(event.getCurrentParticipants() + 1);

        return virtualEventRepository.save(event);
    }

    @Override
    public void deleteEvent(String id) {
        virtualEventRepository.deleteById(id);
    }

    @Override
    public Optional<VirtualEvent> getEventById(String id) {
        return virtualEventRepository.findById(id);
    }

    @Override
    public List<VirtualEvent> getAllEvents() {
        return virtualEventRepository.findAll();
    }

    @Override
    public List<VirtualEvent> getEventsByOrganizer(String organizerId) {
        return virtualEventRepository.findByOrganizerId(organizerId);
    }

    @Override
    public List<VirtualEvent> getEventsBetween(LocalDateTime start, LocalDateTime end) {
        return virtualEventRepository.findByScheduledAtBetween(start, end);
    }

    @Override
    public List<VirtualEvent> getRecordedEvents() {
        return virtualEventRepository.findByIsRecording(true);
    }



}
