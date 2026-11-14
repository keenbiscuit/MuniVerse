package com.github.keenbiscuit.muniverse.controller;

import java.util.Map;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClient;
import org.springframework.security.oauth2.client.annotation.RegisteredOAuth2AuthorizedClient;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.HttpClientErrorException;

import com.github.keenbiscuit.muniverse.dtos.TopArtistsResponseDto;
import com.github.keenbiscuit.muniverse.dtos.TopTracksResponseDto;
import com.github.keenbiscuit.muniverse.dtos.universe.UniverseResponseDto;
import com.github.keenbiscuit.muniverse.service.SpotifyService;
import com.github.keenbiscuit.muniverse.service.UniverseService;

@RestController
public class SpotifyController {

    private final SpotifyService spotifyService;
    private final UniverseService universeService;

    public SpotifyController(SpotifyService spotifyRestClient, UniverseService universeService) {
        this.spotifyService = spotifyRestClient;
        this.universeService = universeService;
    }

    // Get a user's top artists
    @GetMapping("/spotify/top-artists")
    public TopArtistsResponseDto getTopArtists(
            @RegisteredOAuth2AuthorizedClient("spotify") OAuth2AuthorizedClient authorizedClient,
            @RequestParam(name = "timeRange", defaultValue = "short_term") String timeRange) {

        return spotifyService.fetchArtists(timeRange);
    }

    // Get a user's top tracks
    @GetMapping("/spotify/top-tracks")
    public TopTracksResponseDto getTopTracks(
            @RegisteredOAuth2AuthorizedClient("spotify") OAuth2AuthorizedClient authorizedClient,
            @RequestParam(name = "timeRange", defaultValue = "short_term") String timeRange) {

        return spotifyService.fetchTopTracks(timeRange);
    }

    // Get a user's Musical Universe
    @GetMapping("/spotify/universe")
    public UniverseResponseDto getUniverse(
            @RegisteredOAuth2AuthorizedClient("spotify") OAuth2AuthorizedClient authorizedClient,
            @RequestParam(name = "timeRange", defaultValue = "short_term") String timeRange) {
        return universeService.fetchUniverse(timeRange);
    }

    @ExceptionHandler(HttpClientErrorException.TooManyRequests.class)
    public ResponseEntity<Map<String, String>> handleSpotifyQuota(
            HttpClientErrorException.TooManyRequests exception) {

        HttpHeaders headers = new HttpHeaders();
        headers.setCacheControl("no-store");

        HttpHeaders spotifyHeaders = exception.getResponseHeaders();

        if (spotifyHeaders != null) {
            String retryAfter = spotifyHeaders.getFirst(HttpHeaders.RETRY_AFTER);

            if (retryAfter != null) {
                headers.set(HttpHeaders.RETRY_AFTER, retryAfter);
            }
        }

        return ResponseEntity
                .status(HttpStatus.TOO_MANY_REQUESTS)
                .headers(headers)
                .body(Map.of(
                        "code", "SPOTIFY_REQUEST_LIMIT",
                        "message",
                        "Spotify's API request limit or quota has been reached. "
                                + "Please try again later."));
    }
}