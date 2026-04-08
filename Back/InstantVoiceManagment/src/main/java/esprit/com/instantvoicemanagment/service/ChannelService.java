package esprit.com.instantvoicemanagment.service;


import esprit.com.instantvoicemanagment.entity.Channel;
import esprit.com.instantvoicemanagment.repository.ChannelRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ChannelService {

    private final ChannelRepo channelRepo;

    // Get channels visible to a specific user
    public List<Channel> getChannelsForUser(String userId, String role, String userPost) {
        return channelRepo.findAll().stream()
                .filter(c -> {
                    if (c.isPostChannel()) {
                        // Non-simple members see ALL post channels
                        if (!"MEMBRE_SIMPLE".equals(role)) return true;
                        // Simple members see only their matching post channel
                        return userPost != null && userPost.equals(c.getName());
                    }
                    // Regular channels: public or member
                    return !c.isPrivate()
                            || c.getMemberIds() == null
                            || c.getMemberIds().isEmpty()
                            || c.getMemberIds().contains(userId);
                })
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

    // Remove a member from a post channel
    public void removeFromPostChannel(String postName, String memberId) {
        channelRepo.findByNameAndPostChannel(postName, true).ifPresent(channel -> {
            channel.getMemberIds().remove(memberId);
            channelRepo.save(channel);
        });
    }

    // Sync: remove member from every post channel except their current one, then add to current one
    public Channel syncMemberPostChannel(String memberId, String currentPost) {
        channelRepo.findAll().stream()
                .filter(c -> c.isPostChannel()
                        && !c.getName().equals(currentPost)
                        && c.getMemberIds().contains(memberId))
                .forEach(c -> {
                    c.getMemberIds().remove(memberId);
                    channelRepo.save(c);
                });
        return ensurePostChannel(currentPost, memberId);
    }

    // Ensure a post channel exists for the given post name, and add the member to it
    public Channel ensurePostChannel(String postName, String memberId) {
        Channel channel = channelRepo.findByNameAndPostChannel(postName, true)
                .orElseGet(() -> {
                    Channel c = new Channel();
                    c.setName(postName);
                    c.setPostChannel(true);
                    c.setPrivate(true);
                    return channelRepo.save(c);
                });
        if (memberId != null && !memberId.isEmpty() && !channel.getMemberIds().contains(memberId)) {
            channel.getMemberIds().add(memberId);
            return channelRepo.save(channel);
        }
        return channel;
    }
}
