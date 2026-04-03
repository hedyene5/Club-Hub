package esprit.com.clubhub.entity;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.DBRef;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

@Document(collection = "users")
public class User {

    @Id
    private String id;

    @NotBlank(message = "Le prénom est obligatoire")
    private String firstName;

    @NotBlank(message = "Le nom est obligatoire")
    private String lastName;

    @NotBlank(message = "Le numéro de téléphone est obligatoire")
    @Pattern(regexp = "^[+]?[0-9]{8,15}$", message = "Numéro de téléphone invalide")
    private String phoneNumber;

    @NotBlank(message = "L'email est obligatoire")
    @Email(message = "Email invalide")
    private String email;

    @NotBlank(message = "Le mot de passe est obligatoire")
    private String password;

    private Role role;

    private String profilePhoto;

    @DBRef
    private Club club;

    public User() {}

    // Getters & Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }

    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }

    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }

    public Club getClub() { return club; }
    public void setClub(Club club) { this.club = club; }

    public String getProfilePhoto() { return profilePhoto; }
    public void setProfilePhoto(String profilePhoto) { this.profilePhoto = profilePhoto; }
}