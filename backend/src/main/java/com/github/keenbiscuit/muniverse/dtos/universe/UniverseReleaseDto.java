package com.github.keenbiscuit.muniverse.dtos.universe;

import java.util.ArrayList;
import java.util.List;

import com.github.keenbiscuit.muniverse.dtos.ImageDto;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * ArtistReleaseDto
 */
@Data 
@NoArgsConstructor 
@AllArgsConstructor 
public class UniverseReleaseDto {
    // release Id
    private String id;

    // release name
    private String name;

    // release date
    private String release_date;

    // release type
    private String album_type;

    // list of album covers
    private List<ImageDto> images = new ArrayList<>();

    // List of tracks
    private List<UniverseTrackDto> tracks = new ArrayList<>();
}
