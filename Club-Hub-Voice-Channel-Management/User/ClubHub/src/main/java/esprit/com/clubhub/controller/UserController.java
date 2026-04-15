package esprit.com.clubhub.controller;

import esprit.com.clubhub.dto.AuthResponse;
import esprit.com.clubhub.entity.User;
import esprit.com.clubhub.security.JwtUtil;
import esprit.com.clubhub.service.UserService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;
    private final JwtUtil jwtUtil;

    public UserController(UserService userService, JwtUtil jwtUtil) {
        this.userService = userService;
        this.jwtUtil = jwtUtil;
    }

    // Helper : extrait le userId depuis le cookie JWT
    private String getUserIdFromRequest(HttpServletRequest request) {
        if (request.getCookies() == null) return null;
        return Arrays.stream(request.getCookies())
                .filter(c -> "jwt".equals(c.getName()))
                .map(Cookie::getValue)
                .map(jwtUtil::extractUserId)
                .findFirst()
                .orElse(null);
    }

    // Helper : extrait le role depuis le cookie JWT
    private String getRoleFromRequest(HttpServletRequest request) {
        if (request.getCookies() == null) return null;
        return Arrays.stream(request.getCookies())
                .filter(c -> "jwt".equals(c.getName()))
                .map(Cookie::getValue)
                .map(jwtUtil::extractRole)
                .findFirst()
                .orElse(null);
    }

    // GET /api/users/me
    @GetMapping("/me")
    public ResponseEntity<AuthResponse> getMe(HttpServletRequest request) {
        String userId = getUserIdFromRequest(request);
        if (userId == null) return ResponseEntity.status(401).build();

        User user = userService.getUserById(userId);

        // ✅ CORRIGÉ : utiliser getClubId() au lieu de getClub()
        AuthResponse response = new AuthResponse(
                null,
                user.getId(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                user.getPhoneNumber(),
                user.getRole(),  // ✅ role est maintenant un String
                user.getClubId(),
                user.getProfilePhoto()
        );
        return ResponseEntity.ok(response);
    }

    // PUT /api/users/{id}/photo
    @PutMapping("/{id}/photo")
    public ResponseEntity<User> updatePhoto(
            @PathVariable String id,
            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(
                userService.updateProfilePhoto(id, body.get("photoUrl"))
        );
    }

    // GET /api/users
    @GetMapping
    public List<User> getAll() {
        return userService.getAllUsers();
    }

    // GET /api/users/{id}
    @GetMapping("/{id}")
    public ResponseEntity<User> getById(@PathVariable String id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    // PUT /api/users/{id}
    @PutMapping("/{id}")
    public ResponseEntity<User> update(@PathVariable String id,
                                       @RequestBody User updated) {
        return ResponseEntity.ok(userService.updateUser(id, updated));
    }

    // DELETE /api/users/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }

    // DELETE /api/users/by-post/{postName}
    @DeleteMapping("/by-post/{postName}")
    public ResponseEntity<Void> clearPostByName(
            @PathVariable String postName,
            HttpServletRequest request) {
        String role = getRoleFromRequest(request);
        if (role == null) return ResponseEntity.status(401).build();
        if ("MEMBRE_SIMPLE".equals(role)) return ResponseEntity.status(403).build();
        userService.clearPostByName(postName);
        return ResponseEntity.noContent().build();
    }

    // GET /api/users/members
    @GetMapping("/members")
    public ResponseEntity<List<User>> getSimpleMembers() {
        return ResponseEntity.ok(userService.getSimpleMembers());
    }

    // GET /api/users/bureau
    @GetMapping("/bureau")
    public ResponseEntity<List<User>> getBureauMembers() {
        return ResponseEntity.ok(userService.getBureauMembers());
    }

    // PUT /api/users/{id}/post
    @PutMapping("/{id}/post")
    public ResponseEntity<User> assignPost(
            @PathVariable String id,
            @RequestBody Map<String, String> body,
            HttpServletRequest request) {
        String role = getRoleFromRequest(request);
        if (role == null) return ResponseEntity.status(401).build();
        if ("MEMBRE_SIMPLE".equals(role)) return ResponseEntity.status(403).build();
        return ResponseEntity.ok(userService.assignPost(id, body.get("post")));
    }

    // ===== NOUVEAUX ENDPOINTS pour compatibilité avec Club Service =====

    // GET /api/users/club/{clubId}
    @GetMapping("/club/{clubId}")
    public ResponseEntity<List<User>> getUsersByClub(@PathVariable String clubId) {
        return ResponseEntity.ok(userService.getUsersByClub(clubId));
    }

    // PUT /api/users/{id}/club - Associer un club à un utilisateur
    @PutMapping("/{id}/club")
    public ResponseEntity<User> updateUserClub(
            @PathVariable String id,
            @RequestBody Map<String, String> body) {
        User user = userService.getUserById(id);
        user.setClubId(body.get("clubId"));
        return ResponseEntity.ok(userService.updateUser(id, user));
    }
}