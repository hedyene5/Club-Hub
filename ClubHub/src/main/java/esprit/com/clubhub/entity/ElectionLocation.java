package esprit.com.clubhub.entity;

public class ElectionLocation {
    private String address;      // Adresse textuelle (ex: "Amphi A, Campus Universitaire de la Manouba")
    private double latitude;     // Coordonnée latitude
    private double longitude;    // Coordonnée longitude
    private String placeName;    // Nom du lieu (optionnel)

    public ElectionLocation() {}

    public ElectionLocation(String address, double latitude, double longitude) {
        this.address = address;
        this.latitude = latitude;
        this.longitude = longitude;
    }

    public ElectionLocation(String address, double latitude, double longitude, String placeName) {
        this.address = address;
        this.latitude = latitude;
        this.longitude = longitude;
        this.placeName = placeName;
    }

    // Getters
    public String getAddress() { return address; }
    public double getLatitude() { return latitude; }
    public double getLongitude() { return longitude; }
    public String getPlaceName() { return placeName; }

    // Setters
    public void setAddress(String address) { this.address = address; }
    public void setLatitude(double latitude) { this.latitude = latitude; }
    public void setLongitude(double longitude) { this.longitude = longitude; }
    public void setPlaceName(String placeName) { this.placeName = placeName; }

    @Override
    public String toString() {
        return "ElectionLocation{" +
                "address='" + address + '\'' +
                ", latitude=" + latitude +
                ", longitude=" + longitude +
                ", placeName='" + placeName + '\'' +
                '}';
    }
}