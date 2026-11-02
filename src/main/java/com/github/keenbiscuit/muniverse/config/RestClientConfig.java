/*Rest client configuration class to create the Spotify Http client
  Designed to keep configuration seperate from authentication */

package com.github.keenbiscuit.muniverse.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClientManager;
import org.springframework.security.oauth2.client.web.client.OAuth2ClientHttpRequestInterceptor;
import org.springframework.web.client.RestClient;

@Configuration
public class RestClientConfig {
    
    @Bean
    public RestClient spotifyRestClient(RestClient.Builder builder, OAuth2AuthorizedClientManager authorizedClientManager)
    {
        OAuth2ClientHttpRequestInterceptor requestInterceptor =
				new OAuth2ClientHttpRequestInterceptor(authorizedClientManager);

        return builder
              .baseUrl("https://api.spotify.com")
              .requestInterceptor(requestInterceptor)
              .build();
    }
}
