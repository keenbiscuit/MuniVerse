package com.github.keenbiscuit.muniverse.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/muniverse")
public class MuniverseController {

    @GetMapping
    public String index() {
        return "Muniverse is running";
    }

}