package com.github.keenbiscuit.muniverse.dtos;

import org.junit.jupiter.api.Test;

import tools.jackson.databind.json.JsonMapper;

import static org.junit.jupiter.api.Assertions.*;

class TopArtistsResponseDtoTest {

    private final JsonMapper mapper = JsonMapper.builder().build();

    @Test
    void mapsSpotifyResponseIntoDtos() throws Exception {
        String json = """
                {
                  "items": [
                    {
                      "id": "artist-123",
                      "name": "Example Artist",
                      "href": "https://api.spotify.com/v1/artists/artist-123",
                      "external_urls": {
                        "spotify": "https://open.spotify.com/artist/artist-123"
                      },
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

        TopArtistsResponseDto response =
                mapper.readValue(json, TopArtistsResponseDto.class);

        assertNotNull(response.getItems());
        assertEquals(1, response.getItems().size());

        ArtistDto artist = response.getItems().get(0);

        assertAll(
                () -> assertEquals("artist-123", artist.getId()),
                () -> assertEquals("Example Artist", artist.getName()),
                () -> assertNotNull(artist.getImages()),
                () -> assertEquals(1, artist.getImages().size())
        );

        ArtistImageDto image = artist.getImages().get(0);

        assertAll(
                () -> assertEquals(
                        "https://example.com/artist.jpg",
                        image.getUrl()
                ),
                () -> assertEquals(Integer.valueOf(640), image.getWidth()),
                () -> assertEquals(Integer.valueOf(640), image.getHeight())
        );
    }

    @Test
    void serializesImageDimensionsAsNumbers() throws Exception {
        ArtistImageDto image = new ArtistImageDto();
        image.setUrl("https://example.com/artist.jpg");
        image.setWidth(640);
        image.setHeight(320);

        String json = mapper.writeValueAsString(image);
        var node = mapper.readTree(json);

        assertAll(
                () -> assertTrue(node.get("width").isNumber()),
                () -> assertTrue(node.get("height").isNumber()),
                () -> assertEquals(640, node.get("width").intValue()),
                () -> assertEquals(320, node.get("height").intValue())
        );
    }

    @Test
    void mapsEmptyArtistList() throws Exception {
        String json = """
                {
                  "items": []
                }
                """;

        TopArtistsResponseDto response =
                mapper.readValue(json, TopArtistsResponseDto.class);

        assertNotNull(response.getItems());
        assertTrue(response.getItems().isEmpty());
    }
}