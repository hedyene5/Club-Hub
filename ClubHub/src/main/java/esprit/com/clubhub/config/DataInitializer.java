package esprit.com.clubhub.config;
import esprit.com.clubhub.entity.Club;

import esprit.com.clubhub.repository.ClubRepo;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DataInitializer {
    @Bean
    CommandLineRunner initClubs(ClubRepo clubRepository) {
        return args -> {

            if (clubRepository.count() == 0) {

                clubRepository.save(new Club(null, "Club Info", "Club informatique"));
                clubRepository.save(new Club(null, "Club Robotique", "Club robotique"));
                clubRepository.save(new Club(null, "Club Music", "Club musique"));

                System.out.println("✅ Clubs ajoutés !");
            }
        };
    }
}
