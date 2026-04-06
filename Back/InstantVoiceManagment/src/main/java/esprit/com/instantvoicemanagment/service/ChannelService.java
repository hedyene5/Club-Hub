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

    // Get channels visible to a specific user
    public List<Channel> getChannelsForUser(String userId) {
        return channelRepo.findAll().stream()
                .filter(c -> c.getMemberIds() == null
                        || c.getMemberIds().isEmpty()
                        || c.getMemberIds().contains(userId))
                .collect(java.util.stream.Collectors.toList());
    }

    // Get all channels (admin use)
    public List<Channel> getAllChannels() {
        return channelRepo.findAll();
    }

    // Get channel by ID
    public Channel getChannelById(String id) {
        return channelRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Channel not found: " + id));
    }

    // Create channel — MEMBRE_SIMPLE is not allowed
    public Channel createChannel(Channel channel, String creatorId, String creatorRole) {
        if ("MEMBRE_SIMPLE".equals(creatorRole)) {
            throw new RuntimeException("MEMBRE_SIMPLE cannot create channels");
        }
        channel.setCreatedBy(creatorId);
        if (creatorId != null && !channel.getMemberIds().contains(creatorId)) {
            channel.getMemberIds().add(creatorId);
        }
        return channelRepo.save(channel);
    }

    // Delete channel
    public void deleteChannel(String id) {
        channelRepo.deleteById(id);
    }

    // Add member to channel
    public Channel addMember(String channelId, String userId) {
        Channel channel = getChannelById(channelId);
        if (!channel.getMemberIds().contains(userId)) {
            channel.getMemberIds().add(userId);
        }
        return channelRepo.save(channel);
    }

    // Remove member from channel
    public Channel removeMember(String channelId, String userId) {
        Channel channel = getChannelById(channelId);
        channel.getMemberIds().remove(userId);
        return channelRepo.save(channel);
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
