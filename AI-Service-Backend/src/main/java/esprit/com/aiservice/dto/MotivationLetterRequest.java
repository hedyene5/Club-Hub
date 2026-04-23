package esprit.com.aiservice.dto;

import lombok.Data;
import java.util.List;

@Data
public class MotivationLetterRequest {
    private String candidateName;
    private String clubName;
    private String position;
    private List<String> skills;
    private List<String> motivations;
    private String experience;
}
