package clubhub.service;


import com.mongodb.client.gridfs.model.GridFSUploadOptions;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.gridfs.GridFsOperations;
import org.springframework.data.mongodb.gridfs.GridFsTemplate;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;

@Service
public class ImageStorageService {

    private final GridFsTemplate gridFsTemplate;
    private final GridFsOperations gridFsOperations;

    public ImageStorageService(GridFsTemplate gridFsTemplate,
                               GridFsOperations gridFsOperations) {
        this.gridFsTemplate = gridFsTemplate;
        this.gridFsOperations = gridFsOperations;
    }

    /**
     * Saves image bytes to GridFS, returns the public URL path.
     */
    public String saveImage(byte[] imageBytes, String filename) {
        ObjectId id = gridFsTemplate.store(
                new ByteArrayInputStream(imageBytes),
                filename,
                "image/jpeg"
        );
        return "/api/images/" + id.toHexString();
    }

    /**
     * Retrieves image bytes by GridFS ID.
     */
    public byte[] getImage(String imageId) {
        try {
            var file = gridFsTemplate.findOne(
                    new Query(Criteria.where("_id").is(imageId))
            );
            if (file == null) throw new RuntimeException("Image not found: " + imageId);

            return gridFsOperations.getResource(file)
                    .getInputStream()
                    .readAllBytes();
        } catch (Exception e) {
            throw new RuntimeException("Failed to retrieve image: " + imageId, e);
        }
    }
}
