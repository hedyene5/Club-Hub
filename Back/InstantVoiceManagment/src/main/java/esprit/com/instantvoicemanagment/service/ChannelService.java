package esprit.com.instantvoicemanagment.service;


import esprit.com.instantvoicemanagment.entity.Channel;
import esprit.com.instantvoicemanagment.repository.ChannelRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ChannelService {

    private final ChannelRepo channelRepo;

    // Get all channels
    public List<Channel> getAllChannels() {
        return channelRepo.findAll();
    }

    // Get channel by ID
    public Channel getChannelById(String id) {
        return channelRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Channel not found: " + id));
    }

    // Create channel
    public Channel createChannel(Channel channel) {
        return channelRepo.save(channel);
    }

    // Delete channel
    public void deleteChannel(String id) {
        channelRepo.deleteById(id);
    }

    // Add sub-channel
    public Channel addSubChannel(String channelId, Channel.SubChannel subChannel) {
        Channel channel = getChannelById(channelId);
        subChannel.setId(UUID.randomUUID().toString());
        channel.getSubChannels().add(subChannel);
        return channelRepo.save(channel);
    }

    // Delete sub-channel
    public Channel deleteSubChannel(String channelId, String subChannelId) {
        Channel channel = getChannelById(channelId);
        channel.getSubChannels().removeIf(s -> s.getId().equals(subChannelId));
        return channelRepo.save(channel);
    }
}
