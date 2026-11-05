package com.github.keenbiscuit.muniverse.dtos.universe;

import java.util.ArrayList;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor 
@AllArgsConstructor
public class UniverseResponseDto {
    
    
    // List of artists
    private List<UniverseArtistDto> artists = new ArrayList<>();
}
