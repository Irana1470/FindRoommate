package com.roommate.config;

import com.roommate.service.ChatPresenceService;
import com.roommate.service.NguoiDungService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class WebSocketPresenceListener {

    private final ChatPresenceService chatPresenceService;
    private final NguoiDungService nguoiDungService;
    private final SimpMessagingTemplate messagingTemplate;

    @EventListener
    public void onConnected(SessionConnectedEvent event) {
        Principal principal = StompHeaderAccessor.wrap(event.getMessage()).getUser();
        if (principal == null) {
            return;
        }
        chatPresenceService.markOnline(principal.getName());
        broadcastPresence(principal.getName(), true, LocalDateTime.now());
    }

    @EventListener
    public void onDisconnected(SessionDisconnectEvent event) {
        Principal principal = StompHeaderAccessor.wrap(event.getMessage()).getUser();
        if (principal == null) {
            return;
        }
        LocalDateTime lastActive = LocalDateTime.now();
        chatPresenceService.markOffline(principal.getName());
        broadcastPresence(principal.getName(), false, lastActive);
    }

    private void broadcastPresence(String email, boolean online, LocalDateTime lastActive) {
        Integer userId = nguoiDungService.layNguoiDungTheoEmail(email).getMaNguoiDung();
        messagingTemplate.convertAndSend("/topic/presence", Map.of(
                "userId", userId,
                "email", email,
                "online", online,
                "lastActive", lastActive != null ? lastActive.toString() : null
        ));
    }
}
