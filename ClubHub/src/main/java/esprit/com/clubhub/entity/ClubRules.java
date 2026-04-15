package esprit.com.clubhub.entity;

import java.util.ArrayList;
import java.util.List;

public class ClubRules {
    private String about;
    private List<String> rules;
    private boolean requiresApproval;

    public ClubRules() {
        this.rules = new ArrayList<>();
        this.requiresApproval = true;
    }

    // Getters
    public String getAbout() { return about; }
    public List<String> getRules() { return rules; }
    public boolean isRequiresApproval() { return requiresApproval; }

    // Setters
    public void setAbout(String about) { this.about = about; }
    public void setRules(List<String> rules) { this.rules = rules; }
    public void setRequiresApproval(boolean requiresApproval) { this.requiresApproval = requiresApproval; }
}