package com.github.keenbiscuit.muniverse.dtos.universe;

import java.util.ArrayList;
import java.util.List;

import com.github.keenbiscuit.muniverse.dtos.ArtistDto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data 
@NoArgsConstructor 
@AllArgsConstructor 
public class UniverseTrackDto {
    
    // Track ID
    private String id;

    //Track Name
    private String name;

    // List of artists that appear on this track
    private List<ArtistDto> artists = new ArrayList<>();
}
