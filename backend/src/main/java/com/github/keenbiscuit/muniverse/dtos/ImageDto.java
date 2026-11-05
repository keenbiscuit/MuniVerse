package com.github.keenbiscuit.muniverse.dtos;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data 
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true) 

public class ImageDto {
    private String url;
    private int width;
    private int height;
}
