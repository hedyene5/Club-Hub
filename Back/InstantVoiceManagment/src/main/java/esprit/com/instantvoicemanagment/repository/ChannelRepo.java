package esprit.com.instantvoicemanagment.repository;

import esprit.com.instantvoicemanagment.entity.Channel;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ChannelRepo extends MongoRepository<Channel, String> {

}