package com.github.keenbiscuit.muniverse.controller;

import org.springframework.security.oauth2.client.OAuth2AuthorizedClient;
import org.springframework.security.oauth2.client.annotation.RegisteredOAuth2AuthorizedClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import com.github.keenbiscuit.muniverse.dtos.TopArtistsResponseDto;
import com.github.keenbiscuit.muniverse.dtos.TopTracksResponseDto;
import com.github.keenbiscuit.muniverse.dtos.universe.UniverseResponseDto;
import com.github.keenbiscuit.muniverse.service.SpotifyService;
import com.github.keenbiscuit.muniverse.service.UniverseService;


@RestController
public class SpotifyController {

    private final SpotifyService spotifyService;
    private final UniverseService universeService;
    

    public SpotifyController(SpotifyService spotifyRestClient, UniverseService universeService)
    {
        this.spotifyService = spotifyRestClient;
        this.universeService = universeService;
    }

    // Get a user's top artists
	@GetMapping("/spotify/top-artists")
	public TopArtistsResponseDto getTopArtists(@RegisteredOAuth2AuthorizedClient("spotify") OAuth2AuthorizedClient authorizedClient) {
    
        return spotifyService.fetchArtists();
    }

    // Get a user's top tracks
    @GetMapping("/spotify/top-tracks")
	public TopTracksResponseDto getTopTracks(@RegisteredOAuth2AuthorizedClient("spotify") OAuth2AuthorizedClient authorizedClient) {
    
        return spotifyService.fetchTopTracks();
    }

    // Get a user's Musical Universe
    @GetMapping("/spotify/universe")
    public UniverseResponseDto getUniverse(@RegisteredOAuth2AuthorizedClient("spotify") OAuth2AuthorizedClient authorizedClient)
    {
        return universeService.fetchUniverse();
    }
}