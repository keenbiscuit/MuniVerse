# MuniVerse

MuniVerse turns Spotify listening preferences into an interactive 3D music universe. Explore artists, enter solar systems built from their releases, and follow individual songs as orbiting planets.

Built with a Java/Spring Boot backend and a React frontend using Three.js through React Three Fiber.

## Live Demo

https://muniverse-616g.onrender.com/

Sign in with Spotify to explore your universe. Access depends on the Spotify application's current authorization settings.

### Demo Access

MuniVerse currently uses Spotify Development Mode, so the live demo is
not open to unrestricted public sign-ins. Your Spotify account must be
added to the application's allowlist before you can use its Spotify features.

To run your own instance, you need a Spotify developer application whose
owner has an active Spotify Premium subscription.

## The Experience

MuniVerse organizes music into three levels:

- **Artists:** Explore artist galaxies distributed throughout a navigable 3D universe.
- **Releases:** Enter an artist to discover their albums and other releases as solar systems.
- **Songs:** Explore tracks represented by planets orbiting each release's sun.

The release layer is part of the experience: songs belong to release systems rather than appearing as an unstructured collection of planets.

## Features

### Spotify Integration

- Sign in through Spotify authorization.
- Retrieve music data directly from Spotify—no listening-history uploads.
- Choose between short-term, medium-term, and long-term listening-preference ranges.
- Generate artist and track weights from ranking data.

### Interactive 3D Exploration

- Deterministic, layered artist placement with identity-based position offsets.
- Release suns surrounded by tilted planetary orbits.
- Multiple orbital rings for larger track collections.
- Slower orbital speeds on outer rings.
- Distinct planet visuals and selection indicators.
- Release and song labels.
- Context-aware information and navigation.

### Camera Navigation

- Keyboard flight, mouse-wheel movement, and Shift-drag looking in the universe.
- Animated approaches when entering release systems.
- Smooth approaches to selected song planets.
- Camera follow that tracks an orbiting planet while preserving user-controlled viewing angle and zoom.
- Saved universe viewpoints for returning from artist exploration.

## Technology Stack

| Layer | Technologies |
| --- | --- |
| Backend | Java 21, Spring Boot, Maven |
| Frontend | React, Three.js, React Three Fiber, Drei |
| Music integration | Spotify Web API, OAuth 2.0 |
| Testing | Spring Boot Test, Mockito, Maven Surefire |
| Deployment | Docker, Render |
| Continuous integration | GitHub Actions |

## Architecture

MuniVerse separates music-data processing from spatial presentation.

### Backend

The Spring Boot application handles:

- Spotify authorization and API requests.
- Listening time-range selection.
- Transformation of Spotify responses into universe data.
- Artist ownership and ranking-derived weights.
- Delivery of artist, release, and track data to the frontend.

The frontend requests universe data through:

`GET /spotify/universe?timeRange=short_term`

Supported time-range values:

- `short_term`
- `medium_term`
- `long_term`

### Frontend

The React application handles:

- Spatial layout and visual scale.
- Artist, release, and track selection.
- Orbital animation.
- Camera movement and planet follow.
- Navigation between exploration levels.
- Loading, authorization, and error presentation.

Planet movement runs in the rendering loop rather than through frame-by-frame React state updates.

## Understanding Weights

Artist and track weights are independently derived from their rankings.

They are not:

- Listening minutes.
- Percentages of total listening.
- Spotify affinity scores.

Weights are data values. Visual radii are calculated separately from those values, allowing the scene's presentation to change without redefining what the weights mean.

## Repository Structure

```text
MuniVerse/
├── backend/             # Spring Boot application and Maven wrapper
├── frontend/            # React application and 3D scene
├── .github/workflows/   # GitHub Actions workflows
├── Dockerfile           # Combined frontend/backend container build
└── .dockerignore
```

## Getting Started

### Prerequisites

- Java 21.
- Node.js and npm compatible with the frontend.
- A Spotify developer application.
- Docker, if running the containerized application.
- A Spotify developer application with an active Spotify Premium
  subscription on the app owner's account.

The backend includes a Maven wrapper, so a separate Maven installation is not required.

### 1. Clone the Repository

Clone this repository and open its root directory.

### 2. Configure Spotify

Create or open your application in the Spotify Developer Dashboard.

Register this local callback URI:

```text
http://127.0.0.1:8080/login/oauth2/code/spotify
```

Configure the backend with:

| Variable | Description |
| --- | --- |
| `SPOTIFY_CLIENT_ID` | Spotify application's client ID |
| `SPOTIFY_CLIENT_SECRET` | Spotify application's client secret |
| `SPOTIFY_REDIRECT_URI` | Backend OAuth callback URI |
| `APP_FRONTEND_URL` | Frontend destination after authentication |

For local development, set `APP_FRONTEND_URL` to the actual address used by your frontend development server.

Keep credentials outside version control. Do not place the Spotify client secret in frontend code.

### 3. Start the Backend

From the repository root:

```bash
cd backend
```

On macOS or Linux:

```bash
bash ./mvnw spring-boot:run
```

On Windows PowerShell:

```powershell
.\mvnw.cmd spring-boot:run
```

### 4. Start the Frontend

In another terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the local address printed by the frontend development server.

Ensure the frontend's backend connection configuration matches your local Spring Boot address.

## Running Tests

Run backend tests from the `backend` directory.

On macOS or Linux:

```bash
bash ./mvnw --batch-mode --no-transfer-progress test
```

On Windows PowerShell:

```powershell
.\mvnw.cmd --batch-mode --no-transfer-progress test
```

The test suite includes service-level tests and an application-context startup test.

## Docker

The root Dockerfile builds the React frontend and packages the Spring Boot application into a single deployable container.

Build from the repository root so both application directories are available:

```bash
docker build -t muniverse .
```

With your environment variables in an untracked `.env.docker` file:

```bash
docker run --rm --env-file .env.docker -p 8080:8080 muniverse
```

If you override `SERVER_PORT`, update the container port mapping accordingly.

Never commit a populated environment file.

## Deployment

MuniVerse is deployed as a Docker web service on Render.

The Docker build context is the repository root because the build requires both `frontend/` and `backend/`.

Production environment variables include:

| Variable | Purpose |
| --- | --- |
| `SPOTIFY_CLIENT_ID` | Spotify application identifier |
| `SPOTIFY_CLIENT_SECRET` | Server-side Spotify credential |
| `SPOTIFY_REDIRECT_URI` | Production OAuth callback |
| `APP_FRONTEND_URL` | Production frontend destination |
| `SERVER_PORT` | HTTP port used by Spring Boot |
| `SERVER_FORWARD_HEADERS_STRATEGY` | Forwarded-header handling behind the deployment proxy |

For the current deployment:

```text
APP_FRONTEND_URL=[https://muniverse-616g.onrender.com/](https://muniverse-616g.onrender.com/)
SPOTIFY_REDIRECT_URI=[https://muniverse-616g.onrender.com/login/oauth2/code/spotify](https://muniverse-616g.onrender.com/login/oauth2/code/spotify)
```

Register the production callback in the Spotify Developer Dashboard as well as configuring it on the server.

## Controls

### Universe

| Input | Action |
| --- | --- |
| W / S | Move forward / backward |
| A / D | Move left / right |
| Q / E | Move down / up |
| Shift | Increase keyboard movement speed |
| Shift + left-drag | Look around |
| Mouse wheel | Move forward / backward |
| Click an artist | Enter artist exploration |

### Artist and Release Exploration

- Click a release sun to enter its solar system.
- Click a song planet to inspect and follow it.
- Use the scene's orbit controls to adjust the viewing angle and zoom.
- Use the information panel to return to the system, artist, or universe.
- Click empty space to clear song selection.

## Design Decisions

### Spatial Exploration First

The primary experience is moving through music as a 3D environment. Layout, readable orbital systems, and camera behavior take priority over conventional page navigation.

### Separate Data From Presentation

The backend owns music-data transformation and weights. The frontend owns positioning, rendering, animation, and navigation.

### Deterministic Layout

Artist positions use repeatable offsets derived from artist identity rather than fresh random values on each render. Ranking or dataset changes can still alter the overall layout.

### Lightweight Architecture

The application currently operates without a database, cache layer, or microservice architecture. Data comes directly from Spotify and is transformed for the interactive scene.

## Current Scope

- The exploration hierarchy is artists → releases → songs.
- Genre-based grouping is a possible future direction, not an implemented guarantee.
- The visualization reflects available Spotify data and ranking-derived weights, not a complete accounting of listening history.
- Scene representations are artistic, not a physical simulation.
