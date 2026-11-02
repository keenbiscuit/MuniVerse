package com.github.keenbiscuit.muniverse.service;

import com.github.keenbiscuit.muniverse.dtos.ArtistDto;
import com.github.keenbiscuit.muniverse.dtos.TopArtistsResponseDto;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.*;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class SpotifyServiceTest {

    private MockRestServiceServer mockServer;
    private SpotifyService spotifyService;

    @BeforeEach
    void setUp() {
        RestClient.Builder builder = RestClient.builder()
                .baseUrl("https://api.spotify.com");

        mockServer = MockRestServiceServer.bindTo(builder).build();

        spotifyService = new SpotifyService(builder.build());
    }

    @Test
    void fetchArtistsSendsExpectedRequestAndReturnsMappedResponse() {
        String responseJson = """
                {
                  "items": [
                    {
                      "id": "artist-123",
                      "name": "Example Artist",
                      "images": [
                        {
                          "url": "https://example.com/artist.jpg",
                          "width": 640,
                          "height": 640
                        }
                      ]
                    }
                  ],
                  "total": 1,
                  "limit": 5,
                  "offset": 0,
                  "next": null,
                  "previous": null
                }
                """;

        mockServer.expect(requestTo(
                        "https://api.spotify.com/v1/me/top/artists"
                                + "?time_range=short_term&limit=5"))
                .andExpect(method(HttpMethod.GET))
                .andExpect(queryParam("time_range", "short_term"))
                .andExpect(queryParam("limit", "5"))
                .andExpect(header("Accept", MediaType.APPLICATION_JSON_VALUE))
                .andRespond(withSuccess(
                        responseJson,
                        MediaType.APPLICATION_JSON
                ));

        TopArtistsResponseDto response = spotifyService.fetchArtists();

        assertNotNull(response);
        assertNotNull(response.getItems());
        assertEquals(1, response.getItems().size());

        ArtistDto artist = response.getItems().get(0);

        assertAll(
                () -> assertEquals("artist-123", artist.getId()),
                () -> assertEquals("Example Artist", artist.getName()),
                () -> assertEquals(1, artist.getImages().size())
        );

        assertAll(
                () -> assertEquals(
                        "https://example.com/artist.jpg",
                        artist.getImages().get(0).getUrl()
                ),
                () -> assertEquals(
                        Integer.valueOf(640),
                        artist.getImages().get(0).getWidth()
                ),
                () -> assertEquals(
                        Integer.valueOf(640),
                        artist.getImages().get(0).getHeight()
                )
        );

        mockServer.verify();
    }
}