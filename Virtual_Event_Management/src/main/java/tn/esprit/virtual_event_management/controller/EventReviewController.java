package tn.esprit.virtual_event_management.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import tn.esprit.virtual_event_management.entity.EventReview;
import tn.esprit.virtual_event_management.repository.EventReviewRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/event-reviews")
@RequiredArgsConstructor
public class EventReviewController {
    private final EventReviewRepository reviewRepository;
    private final RestTemplate restTemplate;

    @PostMapping
    public ResponseEntity<?> addReview(@RequestBody ReviewRequest request) {

        if (request.rating() < 1 || request.rating() > 5) {
            return ResponseEntity.badRequest().body("Rating must be between 1 and 5");
        }

        if (request.comment() == null || request.comment().isBlank()) {
            return ResponseEntity.badRequest().body("Comment is required");
        }

        ModerationResponse moderation = moderateComment(request.comment());

        if (!moderation.allowed()) {
            return ResponseEntity.badRequest().body("Comment rejected: " + moderation.reason());
        }

        EventReview review = reviewRepository
                .findByEventIdAndUserId(request.eventId(), request.userId())
                .orElse(EventReview.builder()
                        .eventId(request.eventId())
                        .userId(request.userId())
                        .createdAt(LocalDateTime.now())
                        .build());

        review.setUserName(request.userName());
        review.setRating(request.rating());
        review.setComment(request.comment());
        review.setApproved(true);
        review.setFlagged(false);
        review.setReason("Allowed");

        return ResponseEntity.ok(reviewRepository.save(review));
    }

    @GetMapping("/{eventId}")
    public ResponseEntity<List<EventReview>> getReviews(@PathVariable String eventId) {
        return ResponseEntity.ok(
                reviewRepository.findByEventIdAndApprovedTrueOrderByCreatedAtDesc(eventId)
        );
    }

    @GetMapping("/{eventId}/summary")
    public ResponseEntity<ReviewSummary> getSummary(@PathVariable String eventId) {
        List<EventReview> reviews =
                reviewRepository.findByEventIdAndApprovedTrueOrderByCreatedAtDesc(eventId);

        if (reviews.isEmpty()) {
            return ResponseEntity.ok(new ReviewSummary(0.0, 0));
        }

        double avg = reviews.stream()
                .mapToInt(EventReview::getRating)
                .average()
                .orElse(0.0);

        avg = Math.round(avg * 10.0) / 10.0;

        return ResponseEntity.ok(new ReviewSummary(avg, reviews.size()));
    }

    private ModerationResponse moderateComment(String comment) {
        try {
            String url = "http://localhost:9001/moderate";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, String>> entity =
                    new HttpEntity<>(Map.of("text", comment), headers);

            ResponseEntity<ModerationResponse> response =
                    restTemplate.postForEntity(url, entity, ModerationResponse.class);

            if (response.getBody() != null) {
                return response.getBody();
            }

        } catch (Exception e) {
            System.out.println("⚠️ Local AI moderation unavailable: " + e.getMessage());
        }

        return new ModerationResponse(true, false, "Allowed", 0.0);
    }

    public record ReviewRequest(
            String eventId,
            String userId,
            String userName,
            int rating,
            String comment
    ) {}

    public record ReviewSummary(
            double averageRating,
            long totalReviews
    ) {}

    public record ModerationResponse(
            boolean allowed,
            boolean flagged,
            String reason,
            double score
    ) {}

}
