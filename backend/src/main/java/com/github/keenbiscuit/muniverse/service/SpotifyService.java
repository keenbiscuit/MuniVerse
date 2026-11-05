// Service Class to retrieve spotify data

package com.github.keenbiscuit.muniverse.service;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.MediaType;
import static org.springframework.security.oauth2.client.web.client.RequestAttributeClientRegistrationIdResolver.clientRegistrationId;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import com.github.keenbiscuit.muniverse.dtos.ArtistDto;
import com.github.keenbiscuit.muniverse.dtos.TopArtistsResponseDto;
import com.github.keenbiscuit.muniverse.dtos.TopTracksResponseDto;


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
                        // tells the oauth interceptor which registration to use
                .attributes(clientRegistrationId("spotify"))
                .accept(MediaType.APPLICATION_JSON)
                // reads response into our dto format
                .retrieve()
                .body( TopArtistsResponseDto.class);
    }

    public ArtistDto fetchArtistInfo(String artistId)
    {
        return spotifyRestClient
            .get()
            .uri(uriBuilder -> uriBuilder
                        //base url
                        .path("/v1/artists/{id}")
                        .build(artistId))
                        // tells the oauth interceptor which registration to use
                .attributes(clientRegistrationId("spotify"))
                .accept(MediaType.APPLICATION_JSON)
                // reads response into our dto format
                .retrieve()
                .body( ArtistDto.class);
    }

    public TopTracksResponseDto fetchTopTracks()
    {
        return spotifyRestClient
            .get()
            .uri(uriBuilder -> uriBuilder
                        //base url
                        .path("/v1/me/top/tracks")
                        .queryParam("time_range", "short_term")
                        .queryParam("limit", 5)
                        .build())
                        //tells the oauth interceptor which registration to use
                .attributes(clientRegistrationId("spotify"))
                .accept(MediaType.APPLICATION_JSON)
                // reads the response int our dto format
                .retrieve()
                .body( TopTracksResponseDto.class);
    }

}