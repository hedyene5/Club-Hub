package esprit.com.clubhub.entity;

import java.util.ArrayList;
import java.util.List;

public class SubGroup {
    private String id;
    private String name;
    private String description;
    private List<String> memberIds;

    public SubGroup() {
        this.memberIds = new ArrayList<>();
    }

    public SubGroup(String name, String description) {
        this.name = name;
        this.description = description;
        this.memberIds = new ArrayList<>();
    }

    // Getters
    public String getId() { return id; }
    public String getName() { return name; }
    public String getDescription() { return description; }
    public List<String> getMemberIds() { return memberIds; }

    // Setters
    public void setId(String id) { this.id = id; }
    public void setName(String name) { this.name = name; }
    public void setDescription(String description) { this.description = description; }
    public void setMemberIds(List<String> memberIds) { this.memberIds = memberIds; }
}