package com.github.keenbiscuit.muniverse.service;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.MediaType;
import static org.springframework.security.oauth2.client.web.client.RequestAttributeClientRegistrationIdResolver.clientRegistrationId;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import com.github.keenbiscuit.muniverse.dtos.TopArtistsResponseDto;

@Service 
public class SpotifyService {
    private final RestClient spotifyRestClient;

    public SpotifyService(@Qualifier("spotifyRestClient") RestClient spotifyRestClient)
    {
        this.spotifyRestClient = spotifyRestClient;
    }

    public TopArtistsResponseDto fetchArtists()
    {
        return spotifyRestClient
            .get()
            .uri(uriBuilder -> uriBuilder
                        //base url
                        .path("/v1/me/top/artists")
                        .queryParam("time_range", "short_term")
                        .queryParam("limit", 5)
                        .build())
                        //tells the oauth interceptor which registration to use
                .attributes(clientRegistrationId("spotify"))
                .accept(MediaType.APPLICATION_JSON)
                // reads the response as a raw string for initial inspection
                .retrieve()
                .body( TopArtistsResponseDto.class);
    }
}
