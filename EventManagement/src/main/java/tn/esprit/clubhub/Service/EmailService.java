package tn.esprit.clubhub.Service;

import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import tn.esprit.clubhub.Entity.Event;

@Slf4j
@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Autowired
    private QrCodeService qrCodeService;

    /**
     * Sender address announced in the From header. Defaults to the SMTP
     * username so replies come back to the same mailbox we authenticate
     * with (Gmail refuses messages whose From differs from the auth user
     * unless a "Send mail as" alias is configured).
     */
    @Value("${spring.mail.username:noreply@clubhub.local}")
    private String fromAddress;

    /**
     * Sends the RSVP confirmation email with the QR code embedded inline.
     *
     * Runs on the `mailExecutor` thread pool (see {@code AsyncMailConfig})
     * so the HTTP request that triggered the RSVP returns immediately —
     * a slow SMTP server can no longer block the user's browser.
     *
     * Errors are logged and then rethrown as a {@link RuntimeException}
     * so unit tests and any synchronous caller can detect the failure.
     * In the `createRsvp` flow we still wrap the call in a try/catch so a
     * dead SMTP server doesn't invalidate a valid RSVP, but the stack
     * trace is now loud enough to notice.
     */
    @Async("mailExecutor")
    public void sendRsvpConfirmation(String to, String name, Event event, String qrUrl) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            byte[] qrImage = qrCodeService.generateQrImage(qrUrl);

            helper.setFrom(fromAddress, "ClubHub");
            helper.setTo(to);
            helper.setSubject("Your RSVP Confirmation — " + event.getTitle());
            helper.setText(buildEmailHtml(name, event), true);
            helper.addInline("qrcode", new ByteArrayResource(qrImage), "image/png");

            mailSender.send(message);
            log.info("RSVP email sent to {} for event '{}'", to, event.getTitle());
        } catch (Exception e) {
            log.error("Email failed for {} (event '{}'): {}", to, event.getTitle(), e.getMessage(), e);
            throw new RuntimeException("Failed to send RSVP email to " + to, e);
        }
    }

    private String buildEmailHtml(String name, Event event) {
        String location = event.getLocation() != null ? event.getLocation().getName() : "TBA";
        String date = event.getStartDate() != null ? event.getStartDate().toString() : "TBA";

        return """
            <div style="font-family:Arial,sans-serif;max-width:500px;margin:auto">
              <div style="background:#1A1A2E;padding:24px;border-radius:12px 12px 0 0;text-align:center">
                <h1 style="color:white;margin:0">ClubHub</h1>
              </div>
              <div style="padding:32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px">
                <h2 style="color:#1A1A2E">You're confirmed! 🎉</h2>
                <p>Hi <strong>%s</strong>,</p>
                <p>Your RSVP for <strong>%s</strong> has been confirmed.</p>
                <table style="width:100%%;background:#f9fafb;border-radius:8px;padding:16px;margin:16px 0">
                  <tr><td style="color:#6b7280">Date</td><td><strong>%s</strong></td></tr>
                  <tr><td style="color:#6b7280">Location</td><td><strong>%s</strong></td></tr>
                </table>
                <p style="text-align:center;color:#6b7280;margin-top:24px">
                  Show this QR code at the entrance:
                </p>
                <div style="text-align:center;margin:16px 0">
                  <img src="cid:qrcode" width="200" height="200"
                       style="border:8px solid white;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,0.1)"/>
                </div>
                <p style="color:#ef4444;font-size:12px;text-align:center">
                  This QR code is personal and can only be used once.
                </p>
              </div>
            </div>
        """.formatted(name, event.getTitle(), date, location);
    }
}
