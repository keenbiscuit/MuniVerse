# Muniverse

Muniverse is a work-in-progress Java application that connects to Spotify and retrieves a user's top artists.

I'm building this project to practice working with Spring Boot, OAuth2, external APIs, and automated tests.

## What works so far

- Signing in through Spotify using OAuth2.
- Requesting the signed-in user's top five artists for the short-term time range.
- Returning artist IDs, names, and images through DTOs.
- Testing JSON mapping, image dimension types, and empty artist lists.

There is no frontend yet. The current focus is getting the backend working and tested.

## Tech stack

- Java
- Spring Boot
- Spring Security OAuth2 Client
- Spring RestClient
- Maven
- JUnit
- Lombok

## Requirements

- The Java version specified in `pom.xml`.
- A Spotify account.
- A Spotify developer application with a client ID and client secret.

## Running locally

1. Clone this repository.
2. Open the project in your editor.
3. Configure your Spotify application's client ID, client secret, and redirect URI.
4. Make sure the redirect URI in your Spotify developer settings matches the one configured in the application.
5. Start the application with the Maven wrapper.

On Windows:

    .\mvnw.cmd spring-boot:run

On macOS or Linux:

    ./mvnw spring-boot:run

### Spotify configuration

The application needs these settings:

| Setting | Where to configure it |
| --- | --- |
| Spotify client ID | SPOTIFY_CLIENT_ID |
| Spotify client secret | SPOTIFY_CLIENT_SECRET |
| OAuth redirect URI | http://127.0.0.1:8080/login/oauth2/code/spotify |

Do not commit real client secrets, access tokens, or refresh tokens.

After starting the application, complete the Spotify login flow before requesting your top artists.

Top artists endpoint: [Add your controller's route]

## Response format

The top artists response contains an `items` list. Each artist includes:

- `id`
- `name`
- `images`

Each image includes its URL, width, and height. Width and height are returned as numbers.

The response uses DTOs so the application only returns the Spotify fields it currently needs.

## Automated Tests

GitHub Actions runs the Maven test suite on every push and pull request.

## Running tests

Run all tests with the Maven wrapper:

    .\mvnw.cmd test

A PowerShell helper script is also included.

Run all tests:

    .\test.ps1

Run only the DTO tests:

    .\test.ps1 -TestName TopArtistsResponseDtoTest

Clean the build output and run all tests:

    .\test.ps1 -Clean

The DTO tests use sample JSON and do not need a Spotify login or a live API request.

## Next steps

- Add tests for the Spotify service's outgoing request.
- Improve how API errors are handled.
- Build a frontend to display the returned artists.

## Project status

This project is still in development. I'm adding features in small steps and writing tests as I go.
