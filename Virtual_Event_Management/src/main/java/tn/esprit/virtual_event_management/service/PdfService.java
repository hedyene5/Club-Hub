package tn.esprit.virtual_event_management.service;

import com.itextpdf.io.font.FontProgramFactory;
import com.itextpdf.io.font.PdfEncodings;
import com.itextpdf.io.font.constants.StandardFonts;
import com.itextpdf.kernel.font.PdfFont;
import com.itextpdf.kernel.font.PdfFontFactory;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.properties.BaseDirection;
import com.itextpdf.layout.properties.TextAlignment;
import org.springframework.stereotype.Service;
import tn.esprit.virtual_event_management.entity.VirtualEvent;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.util.Objects;

@Service
public class PdfService {

    /**
     * Ressource classpath (le fichier est sous {@code main/resources/fonts/} dans l’arbre sources).
     * Optionnel : Noto Sans Arabic (Google) — sinon Helvetica uniquement.
     */
    private static final String ARABIC_FONT_RESOURCE = "fonts/NotoSansArabic-Regular.ttf";

    private static final class FontBundle {
        final PdfFont font;
        final boolean supportsArabicRtl;

        FontBundle(PdfFont font, boolean supportsArabicRtl) {
            this.font = font;
            this.supportsArabicRtl = supportsArabicRtl;
        }
    }

    /**
     * Ne jamais utiliser de chemin de type "src/..." (invalide en exécution) — seulement le classpath.
     * Tout échec (fichier absent, TTF corrompu, iText) → Helvetica pour que le planificateur ne plante pas.
     */
    private FontBundle loadFontBundle() {
        try (InputStream in = getClass().getClassLoader().getResourceAsStream(ARABIC_FONT_RESOURCE)) {
            if (in != null) {
                byte[] data = in.readAllBytes();
                if (data.length > 0) {
                    try {
                        return new FontBundle(
                                PdfFontFactory.createFont(
                                        FontProgramFactory.createFont(data),
                                        PdfEncodings.IDENTITY_H
                                ),
                                true
                        );
                    } catch (Exception ex) {
                        // police illisible ou binaire inattendu
                    }
                }
            }
        } catch (Exception ignored) {
            // ressource introuvable ou lecture impossible
        }
        try {
            return new FontBundle(
                    PdfFontFactory.createFont(StandardFonts.HELVETICA, PdfEncodings.CP1252),
                    false
            );
        } catch (Exception e2) {
            try {
                return new FontBundle(PdfFontFactory.createFont(StandardFonts.HELVETICA), false);
            } catch (Exception e3) {
                throw new IllegalStateException("Impossible d’initialiser une police PDF", e3);
            }
        }
    }

    public byte[] generatePdf(String content) {
        return buildPdf("Transcription Audio", content, true);
    }

    /**
     * @param bodyRtl si vrai et police arabe chargée, corps en RTL (transcription).
     *                Les rapports d’événement restent LTR.
     */
    private byte[] buildPdf(String title, String body, boolean bodyRtl) {
        try {
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            PdfWriter writer = new PdfWriter(out);
            PdfDocument pdf = new PdfDocument(writer);
            Document document = new Document(pdf);
            FontBundle fb = loadFontBundle();

            document.add(new Paragraph(title)
                    .setFont(fb.font)
                    .setBold()
                    .setFontSize(18));

            document.add(new Paragraph(" "));

            if (fb.supportsArabicRtl && bodyRtl) {
                document.add(new Paragraph(Objects.toString(body, ""))
                        .setFont(fb.font)
                        .setFontSize(12)
                        .setTextAlignment(TextAlignment.RIGHT)
                        .setBaseDirection(BaseDirection.RIGHT_TO_LEFT));
            } else {
                document.add(new Paragraph(Objects.toString(body, ""))
                        .setFont(fb.font)
                        .setFontSize(12)
                        .setTextAlignment(TextAlignment.LEFT));
            }

            document.close();
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Erreur lors de la génération du PDF", e);
        }
    }

    public byte[] generateEventPdf(VirtualEvent event) {
        StringBuilder content = new StringBuilder();

        content.append("Rapport de l'evenement\n\n");

        content.append("Titre : ").append(Objects.toString(event.getTitle(), "")).append("\n");
        content.append("Categorie : ").append(Objects.toString(event.getCategory(), "-")).append("\n");
        content.append("Date debut : ").append(Objects.toString(event.getScheduledAt(), "")).append("\n");
        content.append("Date fin : ").append(Objects.toString(event.getEndAt(), "")).append("\n");
        content.append("Statut : ").append(Objects.toString(event.getStatus(), "")).append("\n\n");

        content.append("Participants : ")
                .append(Objects.toString(event.getCurrentParticipants(), "0"))
                .append(" / ")
                .append(Objects.toString(event.getMaxParticipants(), "-"))
                .append("\n\n");

        if (event.getParticipants() != null && !event.getParticipants().isEmpty()) {
            content.append("Liste des participants :\n");
            for (int i = 0; i < event.getParticipants().size(); i++) {
                var p = event.getParticipants().get(i);
                if (p == null) {
                    content.append(i + 1).append(".\n");
                } else {
                    content.append(i + 1)
                            .append(". ")
                            .append(Objects.toString(p.getLastName(), ""))
                            .append("\n");
                }
            }
        }

        return buildPdf("Rapport d'evenement", content.toString(), false);
    }
}
