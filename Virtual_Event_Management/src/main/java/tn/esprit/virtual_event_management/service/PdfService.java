package tn.esprit.virtual_event_management.service;
import com.itextpdf.io.font.PdfEncodings;
import com.itextpdf.kernel.font.PdfFont;
import com.itextpdf.kernel.font.PdfFontFactory;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.properties.BaseDirection;
import com.itextpdf.layout.properties.TextAlignment;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;

@Service
public class PdfService {
    public byte[] generatePdf(String content) {
        try {
            ByteArrayOutputStream out = new ByteArrayOutputStream();

            PdfWriter writer = new PdfWriter(out);
            PdfDocument pdf = new PdfDocument(writer);
            Document document = new Document(pdf);

            // 🔥 Charger la police arabe
            PdfFont font = PdfFontFactory.createFont(
                    "src/main/resources/fonts/NotoSansArabic-Regular.ttf",
                    PdfEncodings.IDENTITY_H
            );

            // 🟢 TITRE
            document.add(new Paragraph("Transcription Audio")
                    .setFont(font)
                    .setBold()
                    .setFontSize(18));

            document.add(new Paragraph(" "));

            // 🔥 TEXTE ARABE avec RTL
            Paragraph arabicParagraph = new Paragraph(content)
                    .setFont(font)
                    .setFontSize(12)
                    .setTextAlignment(TextAlignment.RIGHT)       // alignement à droite
                    .setBaseDirection(BaseDirection.RIGHT_TO_LEFT); // direction RTL

            document.add(arabicParagraph);

            document.close();
            return out.toByteArray();

        } catch (Exception e) {
            throw new RuntimeException("Erreur lors de la génération du PDF", e);
        }
    }
}
