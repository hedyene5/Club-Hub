package esprit.com.aiservice.dto;

import lombok.Data;
import java.util.List;

@Data
public class ProgramRequest {
    private String clubName;
    private List<String> objectives;
    private List<String> activities;
    private String duration;
}
