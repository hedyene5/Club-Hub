package tn.esprit.virtual_event_management.service;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import tn.esprit.virtual_event_management.entity.EventRegistration;
import tn.esprit.virtual_event_management.entity.VirtualEvent;
import tn.esprit.virtual_event_management.repository.EventRegistrationRepository;

@Service
@RequiredArgsConstructor
public class EventRegistrationService implements IEventRegistrationService{
    private final EventRegistrationRepository repo;
    private final IVirtualEventService eventService;

    // ✅ REGISTER
    @Override
    public EventRegistration register(String eventId, String userId) {

        VirtualEvent event = eventService.getEventById(eventId)
                .orElseThrow(() -> new RuntimeException("Event introuvable"));

        // ❌ déjà inscrit
        if (repo.findByEventIdAndUserId(eventId, userId).isPresent()) {
            throw new RuntimeException("Déjà inscrit");
        }

        EventRegistration reg = new EventRegistration();
        reg.setEventId(eventId);
        reg.setUserId(userId);

        // 👉 gratuit = payé automatiquement
        reg.setPaid(!event.getIsPaid());

        return repo.save(reg);
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

        VirtualEvent event = eventService.getEventById(eventId)
                .orElseThrow(() -> new RuntimeException("Event introuvable"));

        EventRegistration reg = repo.findByEventIdAndUserId(eventId, userId)
                .orElseThrow(() -> new RuntimeException("Inscription requise"));

        // ❌ paiement obligatoire
        if (event.getIsPaid() && !reg.isPaid()) {
            throw new RuntimeException("Paiement requis");
        }

        // ❌ event complet
        if (event.getMaxParticipants() != null &&
                event.getCurrentParticipants() >= event.getMaxParticipants()) {
            throw new RuntimeException("Event complet");
        }

        // ❌ event terminé
        if ("FINISHED".equals(event.getStatus())) {
            throw new RuntimeException("Event terminé");
        }

        // 🔥 incrément
        if (event.getCurrentParticipants() == null) {
            event.setCurrentParticipants(0);
        }

        event.setCurrentParticipants(event.getCurrentParticipants() + 1);

        return eventService.updateEvent(eventId, event);
    }

    // 🔐 CHECK
    @Override
    public boolean canJoin(String eventId, String userId) {

        EventRegistration reg = repo.findByEventIdAndUserId(eventId, userId)
                .orElse(null);

        if (reg == null) return false;

        if (!reg.isPaid()) return false;

        return true;
    }

}
