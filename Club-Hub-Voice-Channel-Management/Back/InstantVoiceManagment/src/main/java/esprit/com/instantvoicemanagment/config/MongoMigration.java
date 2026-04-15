package esprit.com.instantvoicemanagment.config;

import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import org.bson.Document;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.stereotype.Component;

@Component
public class MongoMigration {

    private final MongoTemplate mongoTemplate;

    public MongoMigration(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void removeSubChannels() {
        MongoDatabase db = mongoTemplate.getDb();
        MongoCollection<Document> channels = db.getCollection("channels");
        channels.updateMany(
            new Document(),
            new Document("$unset", new Document("subChannels", ""))
        );
    }
}
