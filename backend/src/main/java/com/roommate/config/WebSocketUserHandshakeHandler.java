package com.roommate.config;

import org.springframework.http.server.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.support.DefaultHandshakeHandler;

import java.security.Principal;
import java.util.Map;

@Component
public class WebSocketUserHandshakeHandler extends DefaultHandshakeHandler {

    @Override
    protected Principal determineUser(
            ServerHttpRequest request,
            WebSocketHandler wsHandler,
            Map<String, Object> attributes
    ) {
        String email = (String) attributes.get(JwtHandshakeInterceptor.WS_USER_EMAIL_ATTRIBUTE);
        if (email == null || email.isBlank()) {
            return super.determineUser(request, wsHandler, attributes);
        }

        return () -> email;
    }
}
