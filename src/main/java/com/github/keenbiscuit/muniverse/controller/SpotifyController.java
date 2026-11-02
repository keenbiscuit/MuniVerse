package com.github.keenbiscuit.muniverse.controller;

import org.springframework.security.oauth2.client.OAuth2AuthorizedClient;
import org.springframework.security.oauth2.client.annotation.RegisteredOAuth2AuthorizedClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import com.github.keenbiscuit.muniverse.dtos.TopArtistsResponseDto;
import com.github.keenbiscuit.muniverse.service.SpotifyService;


@RestController
public class SpotifyController {

    private final SpotifyService spotifyRestClient;
    

    public SpotifyController(SpotifyService spotifyRestClient)
    {
        this.spotifyRestClient = spotifyRestClient;
    }

    
	@GetMapping("/spotify/top-artists")
	public TopArtistsResponseDto getTopArtists(@RegisteredOAuth2AuthorizedClient("spotify") OAuth2AuthorizedClient authorizedClient) {
    
        return spotifyRestClient.fetchArtists();
    }
}