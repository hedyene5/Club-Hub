package esprit.com.clubhub.controller;

import esprit.com.clubhub.entity.Club;
import esprit.com.clubhub.repository.ClubRepo;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/clubs")
public class ClubController {
    private final ClubRepo clubRepository;

    public ClubController(ClubRepo clubRepository) {
        this.clubRepository = clubRepository;
    }

    @GetMapping
    public List<Club> getAllClubs() {
        return clubRepository.findAll();
    }
}
