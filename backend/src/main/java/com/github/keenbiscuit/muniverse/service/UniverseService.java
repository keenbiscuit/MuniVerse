// Service class to apply owner ship rules and grouping

package com.github.keenbiscuit.muniverse.service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.stereotype.Service;

import com.github.keenbiscuit.muniverse.dtos.AlbumDto;
import com.github.keenbiscuit.muniverse.dtos.ArtistDto;
import com.github.keenbiscuit.muniverse.dtos.TopArtistsResponseDto;
import com.github.keenbiscuit.muniverse.dtos.TopTracksResponseDto;
import com.github.keenbiscuit.muniverse.dtos.TracksDto;
import com.github.keenbiscuit.muniverse.dtos.universe.UniverseArtistDto;
import com.github.keenbiscuit.muniverse.dtos.universe.UniverseReleaseDto;
import com.github.keenbiscuit.muniverse.dtos.universe.UniverseResponseDto;
import com.github.keenbiscuit.muniverse.dtos.universe.UniverseTrackDto;

@Service 
public class UniverseService {

    private final SpotifyService spotifyService;
    
    public UniverseService(SpotifyService spotifyService)
    {
        this.spotifyService = spotifyService;
    }

    // Method to organize universe ownership
    public Map<String, Map<String, List<TracksDto>>> groupUniverse()
    {
        // Fetch track dto
        TopTracksResponseDto topTracksDto = spotifyService.fetchTopTracks();

        // Fetch track items
        List<TracksDto> items = topTracksDto.getItems();

        // Fetch top artists
        TopArtistsResponseDto topArtistsDto = spotifyService.fetchArtists();

        // Feth artist items
        List<ArtistDto> topArtists = topArtistsDto.getItems();

        // Create Mapping from artist to track
        Map<String, Map<String, List<TracksDto>>> grouping = new HashMap<>();

        // Add each artists Id to grouping initialized with an empty map
        for (ArtistDto artist : topArtists) {
            grouping.putIfAbsent(artist.getId(), new HashMap<String,List<TracksDto>>());
        }

        // For each item in the list of track items
        for(TracksDto item : items)
        {
            // Get first artist from credits list
            ArtistDto artistDto = item.getArtists().get(0);

            // Get that artists Id
            String artistId = artistDto.getId();

            // Album object and info
            AlbumDto albumDto = item.getAlbum();

            // Get albumID
            String albumId = albumDto.getId();

            // If artist exists map track to said album
            // Else create album map and then assign track to its list
            grouping.computeIfAbsent(artistId, k -> new HashMap<>()).computeIfAbsent(albumId, k -> new ArrayList<>()).add(item);
        }

        return grouping;
    }

    public UniverseResponseDto buildUniverse(
        Map<String, Map<String, List<TracksDto>>> grouping) {

    // Create outer set of mappings for artists
    Set<Map.Entry<String, Map<String, List<TracksDto>>>> mappings =
            grouping.entrySet();

    // Create universe DTO
    UniverseResponseDto universeResponseDto = new UniverseResponseDto();

    // Create list of artists
    List<UniverseArtistDto> artists = new ArrayList<>();

    // For each artist map entry
    for (Map.Entry<String, Map<String, List<TracksDto>>> entry : mappings) {

        // Create artist DTO
        UniverseArtistDto universeArtistDto = new UniverseArtistDto();

        // Set artist ID
        universeArtistDto.setId(entry.getKey());

        // Fetch artist object
        ArtistDto  artistInfo = spotifyService.fetchArtistInfo(universeArtistDto.getId());

        // Set artist name
        universeArtistDto.setName(artistInfo.getName());
                   
        // Get images for artist
        universeArtistDto.setImages(artistInfo.getImages());

        // Get mappings for release IDs and track lists
        Map<String, List<TracksDto>> releases = entry.getValue();

        // Create release output list
        List<UniverseReleaseDto> universeReleases = new ArrayList<>();

        // For each release belonging to this artist
        for (Map.Entry<String, List<TracksDto>> releaseEntry
                : releases.entrySet()) {

            // Read in track data
            List<TracksDto> tracks = releaseEntry.getValue();

            // Grouping creates nonempty lists; skip an empty one if supplied
            if (tracks.isEmpty()) {
                continue;
            }

            // Read shared metadata from the first track in this release
            TracksDto firstTrack = tracks.get(0);
            AlbumDto album = firstTrack.getAlbum();

            // Create release DTO
            UniverseReleaseDto universeReleaseDto = new UniverseReleaseDto();

            // Set release ID and metadata
            universeReleaseDto.setId(releaseEntry.getKey());
            universeReleaseDto.setName(album.getName());
            universeReleaseDto.setAlbum_type(album.getAlbum_type());
            universeReleaseDto.setRelease_date(album.getRelease_date());
            universeReleaseDto.setImages(album.getImages());

            // Create track output list
            List<UniverseTrackDto> universeTracks = new ArrayList<>();

            // For each track
            for (TracksDto track : tracks) {

                // Create track DTO
                UniverseTrackDto universeTrackDto = new UniverseTrackDto();

                // Set ID
                universeTrackDto.setId(track.getId());

                // Set name
                universeTrackDto.setName(track.getName());

                // Preserve all credited artists on the track
                universeTrackDto.setArtists(track.getArtists());

                // Add track to the release's output list
                universeTracks.add(universeTrackDto);
            }

            // Attach tracks to the release
            universeReleaseDto.setTracks(universeTracks);

            // Add completed release to the artist's output list
            universeReleases.add(universeReleaseDto);
        }

        // Attach releases to the artist
        universeArtistDto.setReleases(universeReleases);

        // Add completed artist to the universe's output list
        artists.add(universeArtistDto);
    }

    // Attach artists to the universe
    universeResponseDto.setArtists(artists);

    // Return completed universe response
    return universeResponseDto;
}

public UniverseResponseDto fetchUniverse()
    {
    return buildUniverse(groupUniverse());
    }

}
