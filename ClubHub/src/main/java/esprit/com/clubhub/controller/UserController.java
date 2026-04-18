package esprit.com.clubhub.controller;

import esprit.com.clubhub.dto.AuthResponse;
import esprit.com.clubhub.entity.User;
import esprit.com.clubhub.security.JwtUtil;
import esprit.com.clubhub.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;
    private final JwtUtil jwtUtil;

    public UserController(UserService userService, JwtUtil jwtUtil) {
        this.userService = userService;
        this.jwtUtil = jwtUtil;
    }

    @GetMapping("/me")
    public ResponseEntity<AuthResponse> getMe(@RequestHeader("Authorization") String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        String userId = jwtUtil.extractUserId(token);
        User user = userService.getUserById(userId);
        AuthResponse response = new AuthResponse(
                null, user.getId(), user.getEmail(),
                user.getFirstName(), user.getLastName(), user.getPhoneNumber(),
                user.getRole().name(),
                user.getClub() != null ? user.getClub().getId() : null,
                user.getProfilePhoto()
        );
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public List<User> getAll() {
        return userService.getAllUsers();
    }

    @GetMapping("/{id}")
    public ResponseEntity<User> getById(@PathVariable String id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<User> update(@PathVariable String id, @RequestBody User updated) {
        return ResponseEntity.ok(userService.updateUser(id, updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }
}