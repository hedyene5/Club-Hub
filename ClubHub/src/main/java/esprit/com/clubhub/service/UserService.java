package esprit.com.clubhub.service;

import esprit.com.clubhub.entity.User;
import esprit.com.clubhub.repository.UserRepo;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserService {

    private final UserRepo userRepo;

    public UserService(UserRepo userRepo) {
        this.userRepo = userRepo;
    }

    public List<User> getAllUsers() {
        return userRepo.findAll();
    }

    public User getUserById(String id) {
        return userRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));
    }

    public User updateUser(String id, User updated) {
        User existing = getUserById(id);
        existing.setFirstName(updated.getFirstName());
        existing.setLastName(updated.getLastName());
        existing.setPhoneNumber(updated.getPhoneNumber());
        existing.setRole(updated.getRole());
        return userRepo.save(existing);
    }

    public void deleteUser(String id) {
        userRepo.deleteById(id);
    }
}