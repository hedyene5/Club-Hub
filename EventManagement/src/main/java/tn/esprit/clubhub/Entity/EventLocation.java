package tn.esprit.clubhub.Entity;

import java.util.Map;

public class EventLocation {
    private String name;
    private String address;
    private Map<String, Double> coordinates;

    public EventLocation() {}

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public Map<String, Double> getCoordinates() { return coordinates; }
    public void setCoordinates(Map<String, Double> coordinates) { this.coordinates = coordinates; }
}