package com.github.keenbiscuit.muniverse.dtos;

import java.util.ArrayList;
import java.util.List;

import lombok.Data;
import lombok.NoArgsConstructor;


@Data
@NoArgsConstructor
public class TopArtistsResponseDto {

    // List of User's Top Artists
    private List<ArtistDto> items = new ArrayList<>();

}
