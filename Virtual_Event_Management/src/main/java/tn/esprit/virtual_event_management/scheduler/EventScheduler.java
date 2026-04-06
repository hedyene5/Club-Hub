package tn.esprit.virtual_event_management.scheduler;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import tn.esprit.virtual_event_management.entity.VirtualEvent;
import tn.esprit.virtual_event_management.service.IVirtualEventService;
import tn.esprit.virtual_event_management.service.PdfService;

import java.io.File;
import java.io.FileOutputStream;
import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
public class EventScheduler {
    private final IVirtualEventService eventService;
    private final PdfService pdfService;
    @Scheduled(fixedRate = 20000)
    public void generatePdfAuto() {

        List<VirtualEvent> events = eventService.getAllEvents();

        for (VirtualEvent event : events) {

            if (event.getEndAt() != null &&
                    event.getEndAt().isBefore(LocalDateTime.now()) &&
                    !"FINISHED".equalsIgnoreCase(event.getStatus())) {

                try {
                    // 🔥 changer status
                    event.setStatus("FINISHED");
                    eventService.updateEvent(event.getId(), event);

                    // 🔥 générer PDF
                    byte[] pdf = pdfService.generateEventPdf(event);

                    // 🔥 sauvegarde
                    File folder = new File("generated-pdfs");
                    if (!folder.exists()) folder.mkdir();

                    FileOutputStream fos = new FileOutputStream(
                            "generated-pdfs/event-" + event.getId() + ".pdf"
                    );

                    fos.write(pdf);
                    fos.close();

                    System.out.println("✅ PDF généré : " + event.getTitle());

                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        }
    }
}
