package com.roommate.service;

import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class ChatPresenceService {

    private final Map<String, Boolean> onlineByEmail = new ConcurrentHashMap<>();
    private final Map<String, LocalDateTime> lastActiveByEmail = new ConcurrentHashMap<>();

    public void markOnline(String email) {
        if (email == null || email.isBlank()) {
            return;
        }
        onlineByEmail.put(email, true);
        lastActiveByEmail.put(email, LocalDateTime.now());
    }

    public void markOffline(String email) {
        if (email == null || email.isBlank()) {
            return;
        }
        onlineByEmail.put(email, false);
        lastActiveByEmail.put(email, LocalDateTime.now());
    }

    public void touch(String email) {
        if (email == null || email.isBlank()) {
            return;
        }
        lastActiveByEmail.put(email, LocalDateTime.now());
    }

    public boolean isOnline(String email) {
        return Boolean.TRUE.equals(onlineByEmail.get(email));
    }

    public LocalDateTime getLastActive(String email) {
        return lastActiveByEmail.get(email);
    }
}
