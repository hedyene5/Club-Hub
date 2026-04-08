package esprit.com.clubhub.repository;
import esprit.com.clubhub.entity.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.Optional;

public interface UserRepo extends MongoRepository<User, String> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    java.util.List<User> findByRole(esprit.com.clubhub.entity.Role role);
}