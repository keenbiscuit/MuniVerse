package com.github.keenbiscuit.muniverse.controller;

import jakarta.servlet.http.HttpServletRequest;

import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClient;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.client.web.OAuth2AuthorizedClientRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class SpotifyAuthController {

    private final OAuth2AuthorizedClientRepository authorizedClientRepository;

    public SpotifyAuthController(
            OAuth2AuthorizedClientRepository authorizedClientRepository) {
        this.authorizedClientRepository = authorizedClientRepository;
    }

    @GetMapping("/spotify/auth/status")
    public ResponseEntity<AuthStatus> getAuthStatus(
            Authentication authentication,
            HttpServletRequest request) {

        boolean connected = false;

        if (authentication instanceof OAuth2AuthenticationToken oauth
                && oauth.isAuthenticated()
                && "spotify".equals(oauth.getAuthorizedClientRegistrationId())) {

            OAuth2AuthorizedClient client = authorizedClientRepository.loadAuthorizedClient(
                    "spotify",
                    oauth,
                    request);

            connected = client != null;
        }

        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .body(new AuthStatus(connected));
    }

    public record AuthStatus(boolean connected) {
    }
}