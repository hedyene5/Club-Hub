package esprit.com.aiservice.repository;

import esprit.com.aiservice.dto.GeneratedContent;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface GeneratedContentRepository extends MongoRepository<GeneratedContent, String> {
    List<GeneratedContent> findByUserId(String userId);
    List<GeneratedContent> findByClubId(String clubId);
    List<GeneratedContent> findByType(String type);
}
