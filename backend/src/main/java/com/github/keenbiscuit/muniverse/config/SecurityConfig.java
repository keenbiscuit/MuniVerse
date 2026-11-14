package com.github.keenbiscuit.muniverse.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {

        @Bean
        public SecurityFilterChain securityFilterChain(
                        HttpSecurity http,
                        @Value("${app.frontend-url}") String frontendUrl)
                        throws Exception {

                http
                                .authorizeHttpRequests(authorize -> authorize
                                                .requestMatchers(
                                                                "/",
                                                                "/index.html",
                                                                "/assets/**",
                                                                "/favicon.ico",
                                                                "/vite.svg",
                                                                "/spotify/auth/status",
                                                                "/oauth2/**",
                                                                "/login/**",
                                                                "/error")
                                                .permitAll()
                                                .anyRequest().authenticated())
                                .oauth2Login(oauth2 -> oauth2
                                                .defaultSuccessUrl(frontendUrl, true))
                                .oauth2Client(Customizer.withDefaults());

                return http.build();
        }
}