package com.github.keenbiscuit.muniverse.dtos;

import java.util.ArrayList;
import java.util.List;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class TopTracksResponseDto {

    // List of Users Top Tracks
    private List<TracksDto> items = new ArrayList<>();

}