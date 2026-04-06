package esprit.com.clubhub.service;


import esprit.com.clubhub.dto.AuthResponse;
import esprit.com.clubhub.dto.LoginRequest;
import esprit.com.clubhub.dto.RegisterRequest;
import esprit.com.clubhub.entity.Club;
import esprit.com.clubhub.entity.Role;
import esprit.com.clubhub.entity.User;
import esprit.com.clubhub.repository.ClubRepo;
import esprit.com.clubhub.repository.UserRepo;
import esprit.com.clubhub.security.JwtUtil;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepo userRepo;
    private final ClubRepo clubRepo;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthService(UserRepo userRepo,
                       ClubRepo clubRepo,
                       PasswordEncoder passwordEncoder,
                       JwtUtil jwtUtil) {
        this.userRepo = userRepo;
        this.clubRepo = clubRepo;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    public AuthResponse register(RegisterRequest request) {
        if (userRepo.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Un compte avec cet email existe déjà");
        }

        Club club = clubRepo.findById(request.getClubId())
                .orElseThrow(() -> new RuntimeException("Club introuvable avec l'id: " + request.getClubId()));

        User user = new User();
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setPhoneNumber(request.getPhoneNumber());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(Role.valueOf(request.getRole()));
        user.setClub(club);
        user.setProfilePhoto(request.getProfilePhoto());

        User saved = userRepo.save(user);

        String token = jwtUtil.generateToken(saved.getEmail(), saved.getId(), saved.getRole().name());
        return new AuthResponse(token, saved.getId(), saved.getEmail(),
                saved.getFirstName(), saved.getLastName(), saved.getPhoneNumber(),
                saved.getRole().name(), club.getId(), saved.getProfilePhoto());
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepo.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Email ou mot de passe incorrect"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Email ou mot de passe incorrect");
        }

        String token = jwtUtil.generateToken(user.getEmail(), user.getId(), user.getRole().name());
        return new AuthResponse(token, user.getId(), user.getEmail(),
                user.getFirstName(), user.getLastName(), user.getPhoneNumber(),
                user.getRole().name(),
                user.getClub() != null ? user.getClub().getId() : null,
                user.getProfilePhoto());
    }
}