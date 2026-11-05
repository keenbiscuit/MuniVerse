package com.github.keenbiscuit.muniverse.dtos;

import java.util.ArrayList;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data 
@NoArgsConstructor 
@AllArgsConstructor 
public class TracksDto {
    
    // Track ID
    private String id;

    //Track Name
    private String name;

    // Album object and info
    private AlbumDto album;

    // List of artists that appear on this track
    private List<ArtistDto> artists = new ArrayList<>();

}
