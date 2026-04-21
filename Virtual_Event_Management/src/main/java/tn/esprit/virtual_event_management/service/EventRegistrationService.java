package tn.esprit.virtual_event_management.service;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import tn.esprit.virtual_event_management.entity.EventRegistration;
import tn.esprit.virtual_event_management.entity.VirtualEvent;
import tn.esprit.virtual_event_management.repository.EventRegistrationRepository;
import tn.esprit.virtual_event_management.repository.VirtualEventRepository;

@Service
@RequiredArgsConstructor
public class EventRegistrationService implements IEventRegistrationService{
    private final EventRegistrationRepository repo;
    private final VirtualEventRepository eventRepository;
    private final EmailService emailService; // ✅ AJOUT

    // ✅ REGISTER
    @Override
    public EventRegistration register(String eventId, String userId) {

        VirtualEvent event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event introuvable"));

        if (repo.findByEventIdAndUserId(eventId, userId).isPresent()) {
            throw new RuntimeException("Déjà inscrit");
        }

        if (event.getMaxParticipants() != null &&
                event.getCurrentParticipants() != null &&
                event.getCurrentParticipants() >= event.getMaxParticipants()) {
            throw new RuntimeException("Event complet");
        }

        EventRegistration reg = new EventRegistration();
        reg.setEventId(eventId);
        reg.setUserId(userId);
        reg.setPaid(!event.getIsPaid()); // gratuit = payé auto

        if (event.getCurrentParticipants() == null) {
            event.setCurrentParticipants(0);
        }
        event.setCurrentParticipants(event.getCurrentParticipants() + 1);
        eventRepository.save(event);

        EventRegistration saved = repo.save(reg);

        // ✅ EMAIL DE CONFIRMATION — userId = email (webservice externe)
        try {
            emailService.sendRegistrationConfirmation(
                    userId, // 👈 si ton userId EST l'email (webservice externe)
                    "Participant",  // pas accès au nom → valeur par défaut
                    event.getTitle(),
                    event.getScheduledAt() != null ? event.getScheduledAt().toString() : "Date à confirmer",
                    event.getMeetingLink() != null ? event.getMeetingLink() : "https://ton-app.com/events/" + event.getId()
            );
        } catch (Exception e) {
            // Ne pas bloquer l'inscription si l'email échoue
            System.out.println("⚠️ Email non envoyé : " + e.getMessage());
        }

        return saved;
    }

    // 💰 PAYMENT
    @Override
    public EventRegistration markAsPaid(String eventId, String userId) {

        EventRegistration reg = repo.findByEventIdAndUserId(eventId, userId)
                .orElseThrow(() -> new RuntimeException("Inscription requise"));

        reg.setPaid(true);

        return repo.save(reg);
    }

    // 🎥 JOIN
    @Override
    public VirtualEvent joinEvent(String eventId, String userId) {

        VirtualEvent event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event introuvable"));

        EventRegistration reg = repo.findByEventIdAndUserId(eventId, userId)
                .orElseThrow(() -> new RuntimeException("Inscription requise"));

        if (event.getIsPaid() && !reg.isPaid()) {
            throw new RuntimeException("Paiement requis");
        }

        if ("FINISHED".equals(event.getStatus())) {
            throw new RuntimeException("Event terminé");
        }

        if (event.getMaxParticipants() != null &&
                event.getCurrentParticipants() >= event.getMaxParticipants()) {
            throw new RuntimeException("Event complet");
        }

        if (reg.isJoined()) {
            throw new RuntimeException("Déjà rejoint");
        }

        reg.setJoined(true);
        repo.save(reg);

        return event;
    }

    // 🔐 CHECK
    @Override
    public boolean canJoin(String eventId, String userId) {

        VirtualEvent event = eventRepository.findById(eventId).orElse(null);
        if (event == null) return false;

        EventRegistration reg = repo.findByEventIdAndUserId(eventId, userId).orElse(null);
        if (reg == null) return false;

        if ("FINISHED".equals(event.getStatus())) return false;

        if (event.getMaxParticipants() != null &&
                event.getCurrentParticipants() >= event.getMaxParticipants()) return false;

        if (event.getIsPaid() && !reg.isPaid()) return false;

        return true;
    }
}
