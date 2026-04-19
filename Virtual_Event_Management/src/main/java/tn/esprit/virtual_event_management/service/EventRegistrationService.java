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

        // ❌ event complet
        if (event.getMaxParticipants() != null &&
                event.getCurrentParticipants() != null &&
                event.getCurrentParticipants() >= event.getMaxParticipants()) {
            throw new RuntimeException("Event complet");
        }

        EventRegistration reg = new EventRegistration();
        reg.setEventId(eventId);
        reg.setUserId(userId);

        // 👉 gratuit = payé automatiquement
        reg.setPaid(!event.getIsPaid());

        // 🔥 INITIALISATION SI NULL
        if (event.getCurrentParticipants() == null) {
            event.setCurrentParticipants(0);
        }

        // 🔥 INCREMENTATION
        event.setCurrentParticipants(event.getCurrentParticipants() + 1);

        // 🔥 SAUVEGARDE EVENT
        eventService.updateEvent(eventId, event);

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

        // ❌ event terminé
        if ("FINISHED".equals(event.getStatus())) {
            throw new RuntimeException("Event terminé");
        }

        // ❌ event complet
        if (event.getMaxParticipants() != null &&
                event.getCurrentParticipants() >= event.getMaxParticipants()) {
            throw new RuntimeException("Event complet");
        }

        // ❌ éviter double join (OPTIONNEL mais conseillé)
        if (reg.isJoined()) {
            throw new RuntimeException("Déjà rejoint");
        }
        // 🔥 marquer comme rejoint
        reg.setJoined(true);
        repo.save(reg);

        return eventService.updateEvent(eventId, event);
    }

    // 🔐 CHECK CORRIGÉ
    @Override
    public boolean canJoin(String eventId, String userId) {

        VirtualEvent event = eventService.getEventById(eventId)
                .orElse(null);

        if (event == null) return false;

        EventRegistration reg = repo.findByEventIdAndUserId(eventId, userId)
                .orElse(null);

        if (reg == null) return false;

        // ❌ event terminé
        if ("FINISHED".equals(event.getStatus())) return false;

        // ❌ event complet
        if (event.getMaxParticipants() != null &&
                event.getCurrentParticipants() >= event.getMaxParticipants()) {
            return false;
        }

        // ❌ paiement
        if (event.getIsPaid() && !reg.isPaid()) return false;

        return true;
    }

}
