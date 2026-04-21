package esprit.com.clubhub.service;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.google.zxing.qrcode.decoder.ErrorCorrectionLevel;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

/**
 * Service de génération de QR Codes pour les élections présentielles
 */
@Service
public class QRCodeService {

    private static final int QR_CODE_WIDTH = 300;
    private static final int QR_CODE_HEIGHT = 300;
    private static final SecureRandom random = new SecureRandom();

    @Value("${app.frontend.url:http://localhost:4200}")
    private String frontendUrl;

    /**
     * Vérification de la configuration au démarrage
     */
    @PostConstruct
    public void init() {
        System.out.println("========================================");
        System.out.println("🔧 QRCodeService - Configuration");
        System.out.println("   Frontend URL: " + frontendUrl);
        System.out.println("========================================");
    }

    /**
     * ✅ NOUVEAU: Génère un token sécurisé pour le QR code
     */
    public String generateQRToken() {
        byte[] tokenBytes = new byte[32];
        random.nextBytes(tokenBytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(tokenBytes);
    }

    /**
     * ✅ AMÉLIORÉ: Génère un QR Code contenant une URL avec token sécurisé
     * 
     * @param qrToken Token unique pour ce QR code
     * @return QR Code en format base64 (data:image/png;base64,...)
     */
    public String generateElectionQRCodeWithUrl(String qrToken) {
        try {
            // URL de validation pour le responsable event
            String validationUrl = frontendUrl + "/elections/scan/" + qrToken;

            System.out.println("📱 Génération QR Code avec URL");
            System.out.println("   URL: " + validationUrl);

            // Configurer les paramètres du QR code
            Map<EncodeHintType, Object> hints = new HashMap<>();
            hints.put(EncodeHintType.ERROR_CORRECTION, ErrorCorrectionLevel.H);
            hints.put(EncodeHintType.CHARACTER_SET, "UTF-8");
            hints.put(EncodeHintType.MARGIN, 1);

            // Générer le QR code avec l'URL
            QRCodeWriter qrCodeWriter = new QRCodeWriter();
            BitMatrix bitMatrix = qrCodeWriter.encode(validationUrl, BarcodeFormat.QR_CODE, 
                                                      QR_CODE_WIDTH, QR_CODE_HEIGHT, hints);

            // Convertir en image
            BufferedImage qrImage = MatrixToImageWriter.toBufferedImage(bitMatrix);

            // Convertir en base64
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            ImageIO.write(qrImage, "PNG", baos);
            byte[] imageBytes = baos.toByteArray();
            String base64Image = Base64.getEncoder().encodeToString(imageBytes);

            System.out.println("   ✅ QR Code généré (" + imageBytes.length + " bytes)");

            // Retourner avec le préfixe data URL
            return "data:image/png;base64," + base64Image;

        } catch (WriterException | IOException e) {
            System.err.println("❌ Erreur génération QR Code: " + e.getMessage());
            e.printStackTrace();
            return null;
        }
    }

    /**
     * ANCIEN: Génère un QR Code contenant les données du membre (DEPRECATED)
     * Conservé pour compatibilité
     */
    @Deprecated
    public String generateElectionQRCode(String userId, String name, String email, 
                                         String role, String electionId, boolean isCandidate) {
        try {
            // Créer le contenu JSON du QR code
            String qrContent = String.format(
                "{\"userId\":\"%s\",\"name\":\"%s\",\"email\":\"%s\",\"role\":\"%s\",\"electionId\":\"%s\",\"isCandidate\":%b,\"timestamp\":%d}",
                userId, name, email, role, electionId, isCandidate, System.currentTimeMillis()
            );

            System.out.println("📱 Génération QR Code pour: " + name);
            System.out.println("   Contenu: " + qrContent);

            // Configurer les paramètres du QR code
            Map<EncodeHintType, Object> hints = new HashMap<>();
            hints.put(EncodeHintType.ERROR_CORRECTION, ErrorCorrectionLevel.H);
            hints.put(EncodeHintType.CHARACTER_SET, "UTF-8");
            hints.put(EncodeHintType.MARGIN, 1);

            // Générer le QR code
            QRCodeWriter qrCodeWriter = new QRCodeWriter();
            BitMatrix bitMatrix = qrCodeWriter.encode(qrContent, BarcodeFormat.QR_CODE, 
                                                      QR_CODE_WIDTH, QR_CODE_HEIGHT, hints);

            // Convertir en image
            BufferedImage qrImage = MatrixToImageWriter.toBufferedImage(bitMatrix);

            // Convertir en base64
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            ImageIO.write(qrImage, "PNG", baos);
            byte[] imageBytes = baos.toByteArray();
            String base64Image = Base64.getEncoder().encodeToString(imageBytes);

            System.out.println("   ✅ QR Code généré (" + imageBytes.length + " bytes)");

            // Retourner avec le préfixe data URL
            return "data:image/png;base64," + base64Image;

        } catch (WriterException | IOException e) {
            System.err.println("❌ Erreur génération QR Code: " + e.getMessage());
            e.printStackTrace();
            return null;
        }
    }

    /**
     * Génère un lien Google Maps à partir des coordonnées
     * 
     * @param latitude Latitude
     * @param longitude Longitude
     * @return URL Google Maps
     */
    public String generateGoogleMapsLink(double latitude, double longitude) {
        return String.format("https://www.google.com/maps?q=%.6f,%.6f", latitude, longitude);
    }

    /**
     * Génère un lien Google Maps avec un nom de lieu
     * 
     * @param latitude Latitude
     * @param longitude Longitude
     * @param placeName Nom du lieu
     * @return URL Google Maps
     */
    public String generateGoogleMapsLink(double latitude, double longitude, String placeName) {
        if (placeName != null && !placeName.isEmpty()) {
            return String.format("https://www.google.com/maps/search/?api=1&query=%.6f,%.6f&query_place_id=%s", 
                                latitude, longitude, placeName.replace(" ", "+"));
        }
        return generateGoogleMapsLink(latitude, longitude);
    }
}
