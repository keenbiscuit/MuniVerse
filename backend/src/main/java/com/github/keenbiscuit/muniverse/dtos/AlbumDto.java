package com.github.keenbiscuit.muniverse.dtos;

import java.util.ArrayList;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data 
@AllArgsConstructor 
@NoArgsConstructor 
public class AlbumDto {
    
    // Album
    private String id;

    // Name of Album
    private String name;

    // Album Type
    private String album_type;

    // Album release date
    private String release_date;

    // List of album coverart
    private List<ImageDto> images = new ArrayList<>();

}
