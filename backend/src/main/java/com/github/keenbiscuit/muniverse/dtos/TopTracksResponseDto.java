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

    // Total items Spotify says are available
    Integer total;

    // Requested page size
    Integer limit;

    // Starting position of the page
    Integer offset;

    // Next-page Url, or null when none exists
    String next;

}