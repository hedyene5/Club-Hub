package esprit.com.instantvoicemanagment.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class VoiceSignalingHandler extends TextWebSocketHandler {

    private final ObjectMapper objectMapper = new ObjectMapper();

    // channelId -> (userId -> session)
    private final Map<String, Map<String, WebSocketSession>> channelMap = new ConcurrentHashMap<>();
    // sessionId -> [channelId, userId]
    private final Map<String, String[]> sessionMeta = new ConcurrentHashMap<>();

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        @SuppressWarnings("unchecked")
        Map<String, Object> msg = (Map<String, Object>) objectMapper.readValue(message.getPayload(), Map.class);
        String type = (String) msg.get("type");
        String channelId = (String) msg.get("channelId");
        String fromUserId = (String) msg.get("fromUserId");
        String targetUserId = (String) msg.get("targetUserId");

        switch (type) {
            case "JOIN"   -> handleJoin(session, channelId, fromUserId);
            case "LEAVE"  -> handleLeave(session);
            case "OFFER", "ANSWER", "ICE" -> forwardToTarget(channelId, targetUserId, msg);
        }
    }

    private void handleJoin(WebSocketSession session, String channelId, String userId) throws Exception {
        channelMap.computeIfAbsent(channelId, k -> new ConcurrentHashMap<>()).put(userId, session);
        sessionMeta.put(session.getId(), new String[]{channelId, userId});

        // Send existing peer IDs back to the new joiner
        List<String> existing = new ArrayList<>(channelMap.get(channelId).keySet());
        existing.remove(userId);
        Map<String, Object> peersMsg = new HashMap<>();
        peersMsg.put("type", "PEERS");
        peersMsg.put("channelId", channelId);
        peersMsg.put("data", existing);
        session.sendMessage(new TextMessage(objectMapper.writeValueAsString(peersMsg)));

        // Broadcast JOINED to all other members in the channel
        Map<String, Object> joinedMsg = new HashMap<>();
        joinedMsg.put("type", "JOINED");
        joinedMsg.put("channelId", channelId);
        joinedMsg.put("fromUserId", userId);
        broadcast(channelId, userId, joinedMsg);
    }

    private void handleLeave(WebSocketSession session) throws Exception {
        String[] meta = sessionMeta.remove(session.getId());
        if (meta == null) return;
        String channelId = meta[0];
        String userId    = meta[1];

        Map<String, WebSocketSession> sessions = channelMap.get(channelId);
        if (sessions != null) {
            sessions.remove(userId);
            if (sessions.isEmpty()) channelMap.remove(channelId);
        }

        Map<String, Object> leftMsg = new HashMap<>();
        leftMsg.put("type", "LEFT");
        leftMsg.put("channelId", channelId);
        leftMsg.put("fromUserId", userId);
        broadcast(channelId, userId, leftMsg);
    }

    private void forwardToTarget(String channelId, String targetUserId, Map<String, Object> msg) throws Exception {
        if (channelId == null || targetUserId == null) return;
        Map<String, WebSocketSession> sessions = channelMap.get(channelId);
        if (sessions == null) return;
        WebSocketSession target = sessions.get(targetUserId);
        if (target != null && target.isOpen()) {
            target.sendMessage(new TextMessage(objectMapper.writeValueAsString(msg)));
        }
    }

    private void broadcast(String channelId, String excludeUserId, Map<String, Object> msg) throws Exception {
        Map<String, WebSocketSession> sessions = channelMap.getOrDefault(channelId, Map.of());
        String json = objectMapper.writeValueAsString(msg);
        for (Map.Entry<String, WebSocketSession> entry : sessions.entrySet()) {
            if (!entry.getKey().equals(excludeUserId) && entry.getValue().isOpen()) {
                entry.getValue().sendMessage(new TextMessage(json));
            }
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        handleLeave(session);
    }
}
