package esprit.com.instantvoicemanagment.entity;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Document(collection = "channels")
public class Channel {

    @Id
    private String id;

    private String name;
    private boolean isPrivate;
    private LocalDateTime createdAt = LocalDateTime.now();

    private List<SubChannel> subChannels = new ArrayList<>();

    @Data
    public static class SubChannel {
        private String id;
        private String name;
    }
}