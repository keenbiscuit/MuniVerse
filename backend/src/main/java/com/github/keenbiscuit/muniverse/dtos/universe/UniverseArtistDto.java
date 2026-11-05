package com.github.keenbiscuit.muniverse.dtos.universe;

import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.github.keenbiscuit.muniverse.dtos.ImageDto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data 
@AllArgsConstructor 
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class UniverseArtistDto {

    // Artist ID
    private String id;

    // Artist name;
    private String name;

    // List of Artist Images
    private List<ImageDto> images = new ArrayList<>();

    // List of releases
    private List<UniverseReleaseDto> releases = new ArrayList<>();

}
