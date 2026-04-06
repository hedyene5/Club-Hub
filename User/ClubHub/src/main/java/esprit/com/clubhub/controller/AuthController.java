package esprit.com.clubhub.controller;

import esprit.com.clubhub.dto.AuthResponse;
import esprit.com.clubhub.dto.LoginRequest;
import esprit.com.clubhub.dto.RegisterRequest;
import esprit.com.clubhub.service.AuthService;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request,
                                      HttpServletResponse response) {
        try {
            AuthResponse auth = authService.register(request);
            setJwtCookie(response, auth.getToken());

            // On retourne les infos user SANS le token
            auth.setToken(null);
            return ResponseEntity.ok(auth);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request,
                                   HttpServletResponse response) {
        try {
            AuthResponse auth = authService.login(request);
            setJwtCookie(response, auth.getToken());

            auth.setToken(null);
            return ResponseEntity.ok(auth);
        } catch (RuntimeException e) {
            return ResponseEntity.status(401).body(e.getMessage());
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletResponse response) {
        ResponseCookie cookie = ResponseCookie.from("jwt", "")
                .httpOnly(true)
                .secure(false)
                .path("/")
                .maxAge(0)
                .sameSite("Lax")
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
        return ResponseEntity.ok("Logged out");
    }

    private void setJwtCookie(HttpServletResponse response, String token) {
        ResponseCookie cookie = ResponseCookie.from("jwt", token)
                .httpOnly(true)
                .secure(false)
                .path("/")
                .maxAge(86400)
                .sameSite("Lax")
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }
    @GetMapping("/check")
    public ResponseEntity<?> checkSession() {
        return ResponseEntity.ok("Session valid");
    }
}