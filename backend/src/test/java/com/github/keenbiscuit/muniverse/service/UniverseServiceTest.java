package com.github.keenbiscuit.muniverse.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.*;

import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;

import com.github.keenbiscuit.muniverse.dtos.AlbumDto;
import com.github.keenbiscuit.muniverse.dtos.ArtistDto;
import com.github.keenbiscuit.muniverse.dtos.TopTracksResponseDto;
import com.github.keenbiscuit.muniverse.dtos.TracksDto;

class UniverseServiceTest {

    @Test
    void groupsTracksByPrimaryArtistAndAlbum() {
        SpotifyService spotifyService = mock(SpotifyService.class);
        UniverseService universeService = new UniverseService(spotifyService);

        ArtistDto dominic = new ArtistDto();
        dominic.setId("dominic");

        ArtistDto grace = new ArtistDto();
        grace.setId("grace");

        AlbumDto howToQuit = new AlbumDto();
        howToQuit.setId("HOW TO QUIT SMOKING");

        AlbumDto whatCould = new AlbumDto();
        whatCould.setId("What Could Possibly Go Wrong");

        TracksDto first = new TracksDto();
        first.setArtists(List.of(dominic, grace));
        first.setName("HONEYLOVE");
        first.setAlbum(howToQuit);

        TracksDto second = new TracksDto();
        second.setArtists(List.of(dominic));
        second.setName("Double Negative"); 
        second.setAlbum(whatCould);

        TracksDto third = new TracksDto();
        third.setArtists(List.of(grace));
        third.setName("HONEYLOVE");
        third.setAlbum(howToQuit);

        TracksDto fourth = new TracksDto();
        fourth.setArtists(List.of(dominic));
        fourth.setName("LILY WAS A CAVALIER");
        fourth.setAlbum(howToQuit);

        

        TopTracksResponseDto response = new TopTracksResponseDto();
        response.setItems(List.of(first, second, third, fourth));



        when(spotifyService.fetchTopTracks()).thenReturn(response);

        Map<String, Map<String, List<TracksDto>>> result = universeService.groupUniverse();
 
        assertEquals(2, result.size());

        assertEquals(2, result.get("dominic").size());
        assertEquals(List.of(first, fourth), result.get("dominic").get("HOW TO QUIT SMOKING"));
        assertEquals(List.of(second), result.get("dominic").get("What Could Possibly Go Wrong"));
        
        assertEquals(1, result.get("grace").size());
        assertEquals(List.of(third), result.get("grace").get("HOW TO QUIT SMOKING"));
    }
}