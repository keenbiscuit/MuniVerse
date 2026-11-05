package com.github.keenbiscuit.muniverse.dtos;

import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data 
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class ArtistDto {

    // Artist Id
    private String id;

    // Artist Name
    private String name;

    // List of artist's profile images
    private List<ImageDto> images = new ArrayList<>();
}
