import { useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Html, Line } from "@react-three/drei";

import ArtistGalaxy from "./ArtistGalaxy";
import SelectionCameraControls from "./SelectionCameraControls";
import SpaceBackground from "./SpaceBackground";
import UniverseFlightControls from "./UniverseFlightControls";
import UniverseInfoPanel from "./UniverseInfoPanel";

import {
  PlanetBody,
  ReleaseSun,
  getSunStyle,
  PLANET_VISUAL_EXTENT,
} from "./SpaceBodies";

// Shared release-system dimensions.
const SUN_RADIUS = 2;
const FIRST_ORBIT_RADIUS = 5;
const ORBIT_SPACING = 4;
const PLANETS_PER_RING = 6;
const ORBIT_TILT = Math.PI / 4;

// Define visual size limits separately from backend weights.
const MIN_RADIUS = 0.6;
const MAX_RADIUS = 1.4;

// Spread artist galaxies apart without increasing their sizes.
const SPHERE_SPACING = 2 * MAX_RADIUS + 0.5;
const LAYOUT_SPACING = SPHERE_SPACING * 3;

// Render miniature systems in the artist overview.
const RELEASE_OVERVIEW_SCALE = 0.45;

function getOrbitRadius(ring) {
  return FIRST_ORBIT_RADIUS + ring * ORBIT_SPACING;
}

function getOrbitPoint(radius, angle) {
  return [
    Math.cos(angle) * radius,
    Math.sin(angle) * radius * Math.cos(ORBIT_TILT),
    Math.sin(angle) * radius * Math.sin(ORBIT_TILT),
  ];
}

// Include planet rings and selection shells when spacing release systems.
function getSystemExtent(trackCount, maxPlanetRadius) {
  if (trackCount === 0) {
    // Suns can be up to 10% larger than the base radius.
    return SUN_RADIUS * 1.1;
  }

  const outerRing = Math.ceil(trackCount / PLANETS_PER_RING) - 1;

  return getOrbitRadius(outerRing) + maxPlanetRadius * PLANET_VISUAL_EXTENT;
}

// Render one song planet and move its complete visual assembly.
function SongPlanet({
  track,
  position,
  minRadius,
  maxRadius,
  isSelected,
  onSelect,
  orbitRadius,
  startAngle,
  orbitSpeed,
  showLabel = false,
}) {
  const trackWeight = track.trackWeight ?? 0;
  const radius = minRadius + (maxRadius - minRadius) * trackWeight;

  const planetRef = useRef(null);
  const angleRef = useRef(startAngle);

  // Move planets before the camera reads their positions for follow mode.
  useFrame((state, delta) => {
    if (!planetRef.current) return;

    const newAngle = angleRef.current + orbitSpeed * delta;
    angleRef.current = newAngle;

    const orbitPoint = getOrbitPoint(orbitRadius, newAngle);

    planetRef.current.position.set(orbitPoint[0], orbitPoint[1], orbitPoint[2]);
  }, -2);

  return (
    <group
      ref={planetRef}
      name={`song-planet-${track.id}`}
      userData={{
        planetRadius: radius * PLANET_VISUAL_EXTENT,
      }}
      position={position}
      onClick={(event) => {
        event.stopPropagation();
        onSelect(track);
      }}
    >
      <PlanetBody trackId={track.id} radius={radius} isSelected={isSelected} />

      {/* Keep the label attached to the moving planet assembly. */}

      {showLabel && (
        <Html
          position={[0, radius * PLANET_VISUAL_EXTENT + 0.35, 0]}
          center
          zIndexRange={[1, 0]}
          style={{ pointerEvents: "none" }}
        >
          <div
            className={
              isSelected
                ? "scene-object-label song-label song-label--selected"
                : "scene-object-label song-label"
            }
          >
            {track.name}
          </div>
        </Html>
      )}
    </group>
  );
}

// Render one release as a sun with orbiting song planets.
function ReleaseSystem({
  release,
  minRadius,
  maxRadius,
  selectedTrackId,
  onSunClick,
  onTrackClick,
  illuminate = false,
  showSongLabels = false,
}) {
  const songs = release.tracks ?? [];
  const ringCount = Math.ceil(songs.length / PLANETS_PER_RING);
  const sunStyle = getSunStyle(release.id, SUN_RADIUS);

  return (
    <group>
      {/* Release sun: click to enter the system or clear song selection. */}
      <group
        onClick={(event) => {
          event.stopPropagation();
          onSunClick();
        }}
      >
        <ReleaseSun
          releaseId={release.id}
          baseRadius={SUN_RADIUS}
          illuminate={illuminate}
        />
      </group>

      {/* Position the release label above its actual seeded sun radius. */}
      <Html
        position={[0, sunStyle.radius + 0.5, 0]}
        center
        zIndexRange={[1, 0]}
        style={{ pointerEvents: "none" }}
      >
        <div className="scene-object-label release-label">{release.name}</div>
      </Html>

      {/* Static orbit paths do not intercept pointer events. */}
      {Array.from({ length: ringCount }, (_, ring) => {
        const orbitRadius = getOrbitRadius(ring);

        const points = Array.from({ length: 97 }, (_, step) => {
          const angle = (step / 96) * Math.PI * 2;
          return getOrbitPoint(orbitRadius, angle);
        });

        return (
          <Line
            key={`orbit-${ring}`}
            points={points}
            color="#84799c"
            lineWidth={1}
            transparent
            opacity={0.35}
            raycast={() => null}
          />
        );
      })}

      {/* Use the same orbit information for placement and animation. */}
      {songs.map((track, index) => {
        const ring = Math.floor(index / PLANETS_PER_RING);
        const slot = index % PLANETS_PER_RING;

        const tracksOnRing = Math.min(
          PLANETS_PER_RING,
          songs.length - ring * PLANETS_PER_RING,
        );

        const orbitRadius = getOrbitRadius(ring);
        const startAngle = (slot / tracksOnRing) * Math.PI * 2 + ring * 0.45;

        const position = getOrbitPoint(orbitRadius, startAngle);
        const orbitSpeed = 0.15 / (1 + 0.4 * ring);

        return (
          <SongPlanet
            key={track.id}
            track={track}
            position={position}
            minRadius={minRadius}
            maxRadius={maxRadius}
            isSelected={track.id === selectedTrackId}
            onSelect={onTrackClick}
            orbitRadius={orbitRadius}
            startAngle={startAngle}
            orbitSpeed={orbitSpeed}
            showLabel={showSongLabels}
          />
        );
      })}
    </group>
  );
}

// Coordinate universe layout, selection, navigation, and camera modes.
function UniverseScene({
  authStatus,
  authError,
  artists,
  activeArtist,
  setActiveArtist,
  timeRange,
  isLoading,
  hasLoaded,
  error,
  onTimeRangeChange,
  onLoadUniverse,
  universeSource,
  onLoadSampleUniverse,
  onUseSpotify,
}) {
  // Artist selected in the universe.
  const [selectedArtist, setSelectedArtist] = useState(null);

  // Release selected inside the active artist galaxy.
  const [selectedRelease, setSelectedRelease] = useState(null);

  // Track selected inside the release system.
  const [selectedTrack, setSelectedTrack] = useState(null);

  // Keep the universe visible while approaching an artist galaxy.
  const [entryRequest, setEntryRequest] = useState(null);

  // Measure only explorable content, not the distant background.
  const sceneContentRef = useRef(null);

  // Preserve the exploration view while an artist is open.
  const savedUniverseViewRef = useRef(null);

  // Derive the camera context from the existing navigation state.
  const viewLevel = !activeArtist
    ? "universe"
    : selectedRelease
      ? "release"
      : "artist";

  const viewKey =
    viewLevel === "universe"
      ? "universe"
      : viewLevel === "artist"
        ? `artist:${activeArtist.id}`
        : `release:${selectedRelease.id}`;

  const viewData = selectedRelease ?? activeArtist ?? artists;
  const releases = activeArtist?.releases ?? [];

  // Build a layered layout for the artist's release systems.
  const releaseColumns = Math.max(1, Math.ceil(Math.cbrt(releases.length)));

  const releaseRows = Math.max(
    1,
    Math.ceil(Math.sqrt(releases.length / releaseColumns)),
  );

  const releasesPerLayer = releaseColumns * releaseRows;

  const releaseLayers = Math.max(
    1,
    Math.ceil(releases.length / releasesPerLayer),
  );

  // Use the largest system to establish safe overview spacing.
  const largestSystemExtent = releases.reduce(
    (largest, release) =>
      Math.max(
        largest,
        getSystemExtent(release.tracks?.length ?? 0, MAX_RADIUS),
      ),
    SUN_RADIUS * 1.1,
  );

  const releaseSpacing = largestSystemExtent * 2 * RELEASE_OVERVIEW_SCALE + 3;

  function getReleasePosition(index) {
    const column = index % releaseColumns;
    const row = Math.floor(index / releaseColumns) % releaseRows;
    const layer = Math.floor(index / releasesPerLayer);

    return [
      (column - (releaseColumns - 1) / 2) * releaseSpacing,
      ((releaseRows - 1) / 2 - row) * releaseSpacing,
      (layer - (releaseLayers - 1) / 2) * releaseSpacing,
    ];
  }

  // Keep one artist per cell, but vary its position within that cell.
  const columns = Math.max(1, Math.ceil(Math.cbrt(artists.length)));

  const rows = Math.max(1, Math.ceil(Math.sqrt(artists.length / columns)));

  const artistsPerLayer = columns * rows;

  const layers = Math.max(1, Math.ceil(artists.length / artistsPerLayer));

  // Derive repeatable offsets from artist identity, not random render values.
  function getArtistOffset(artistId, axis) {
    const value = `${artistId}:${axis}`;
    let hash = 2166136261;

    for (let index = 0; index < value.length; index += 1) {
      hash ^= value.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }

    return (hash >>> 0) / 4294967295 - 0.5;
  }

  const rawArtistPositions = artists.map((artist, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns) % rows;
    const layer = Math.floor(index / artistsPerLayer);

    const layerOffset = (layer % 2 === 0 ? -0.175 : 0.175) * LAYOUT_SPACING;

    const offsetRange = LAYOUT_SPACING * 0.3;

    return [
      (column - (columns - 1) / 2) * LAYOUT_SPACING +
        layerOffset +
        getArtistOffset(artist.id, "x") * offsetRange,

      ((rows - 1) / 2 - row) * LAYOUT_SPACING +
        getArtistOffset(artist.id, "y") * offsetRange,

      (layer - (layers - 1) / 2) * LAYOUT_SPACING +
        getArtistOffset(artist.id, "z") * offsetRange,
    ];
  });

  // Center the occupied layout, including partially filled final layers.
  const layoutCenter = rawArtistPositions.reduce(
    (center, position) => [
      center[0] + position[0],
      center[1] + position[1],
      center[2] + position[2],
    ],
    [0, 0, 0],
  );

  const artistCount = Math.max(1, artists.length);

  const artistPositions = rawArtistPositions.map((position) => [
    position[0] - layoutCenter[0] / artistCount,
    position[1] - layoutCenter[1] / artistCount,
    position[2] - layoutCenter[2] / artistCount,
  ]);

  function getArtistPosition(index) {
    return artistPositions[index] ?? [0, 0, 0];
  }

  // Find the highest-weight artist without assuming array order.
  let largestArtistIndex = -1;

  artists.forEach((artist, index) => {
    if (
      largestArtistIndex === -1 ||
      (artist.artistWeight ?? 0) >
        (artists[largestArtistIndex].artistWeight ?? 0)
    ) {
      largestArtistIndex = index;
    }
  });

  const startingArtist =
    largestArtistIndex >= 0 ? artists[largestArtistIndex] : null;

  const startingGalaxyPosition =
    largestArtistIndex >= 0 ? getArtistPosition(largestArtistIndex) : [0, 0, 0];

  const startingGalaxyRadius = startingArtist
    ? MIN_RADIUS +
      (MAX_RADIUS - MIN_RADIUS) * (startingArtist.artistWeight ?? 0)
    : MIN_RADIUS;

  // Begin outside the largest galaxy with a slightly elevated viewpoint.
  const startingDistance = Math.max(4, startingGalaxyRadius * 4);

  const universeStartPosition = [
    startingGalaxyPosition[0],
    startingGalaxyPosition[1] + startingGalaxyRadius * 0.6,
    startingGalaxyPosition[2] + startingDistance,
  ];

  // Invalidate the saved view when artist layout inputs change.
  const universeKey = JSON.stringify({
    layoutSpacing: LAYOUT_SPACING,
    artists: artists.map((artist) => [artist.id, artist.artistWeight ?? 0]),
  });

  // Select an artist and prepare the approach before entering.
  function handleArtistClick(artist) {
    if (activeArtist || entryRequest) return;

    const artistIndex = artists.findIndex((item) => item.id === artist.id);

    if (artistIndex < 0) return;

    const radius =
      MIN_RADIUS + (MAX_RADIUS - MIN_RADIUS) * (artist.artistWeight ?? 0);

    setSelectedArtist(artist);
    setSelectedRelease(null);
    setSelectedTrack(null);

    setEntryRequest({
      artist,
      position: getArtistPosition(artistIndex),
      radius,
    });
  }

  // Clear the current selection when clicking empty space.
  function handleClearSelection() {
    if (entryRequest) return;

    if (activeArtist) {
      setSelectedTrack(null);
      return;
    }

    setSelectedArtist(null);
    setSelectedRelease(null);
    setSelectedTrack(null);
  }

  // Return to the universe and clear all nested selections.
  function handleBackToUniverse() {
    setActiveArtist(null);
    setSelectedArtist(null);
    setSelectedRelease(null);
    setSelectedTrack(null);
    setEntryRequest(null);
  }

  // Enter the artist only after the camera approach finishes.
  function handleGalaxyEntryComplete(artist) {
    setActiveArtist(artist);
    setSelectedArtist(artist);
    setSelectedRelease(null);
    setSelectedTrack(null);
    setEntryRequest(null);
  }

  // Enter one release system and clear the previous track selection.
  function handleReleaseClick(release) {
    setSelectedRelease(release);
    setSelectedTrack(null);
  }

  // Select a song planet for details and camera follow.
  function handleTrackClick(track) {
    setSelectedTrack(track);
  }

  // Return to the active artist's release collection.
  function handleBackToArtist() {
    setSelectedRelease(null);
    setSelectedTrack(null);
  }

  // Leave song inspection without leaving the release system.
  function handleBackToSystem() {
    setSelectedTrack(null);
  }

  return (
    <div className="universe-scene">
      {/* One context-aware panel owns details, navigation, and travel help. */}
      <UniverseInfoPanel
        authStatus={authStatus}
        authError={authError}
        startingArtist={startingArtist}
        selectedArtist={selectedArtist}
        activeArtist={activeArtist}
        selectedRelease={selectedRelease}
        selectedTrack={selectedTrack}
        entryRequest={entryRequest}
        timeRange={timeRange}
        isLoading={isLoading}
        hasLoaded={hasLoaded}
        artistCount={artists.length}
        error={error}
        onTimeRangeChange={onTimeRangeChange}
        onLoadUniverse={onLoadUniverse}
        onBackToUniverse={handleBackToUniverse}
        onBackToArtist={handleBackToArtist}
        onBackToSystem={handleBackToSystem}
        universeSource={universeSource}
        onLoadSampleUniverse={onLoadSampleUniverse}
        onUseSpotify={onUseSpotify}
      />

      <div className="scene-viewport">
        <div className="scene-canvas">
          <Canvas
            camera={{ position: [0, 0, 40], fov: 40 }}
            onPointerMissed={handleClearSelection}
          >
            <color attach="background" args={["#05020b"]} />

            {/* Keep distant scenery outside the measured content group. */}
            <SpaceBackground />

            {/* Only one camera-control system is active at a time. */}
            {!activeArtist ? (
              <UniverseFlightControls
                startPosition={universeStartPosition}
                startTarget={startingGalaxyPosition}
                universeKey={universeKey}
                savedViewRef={savedUniverseViewRef}
                entryRequest={entryRequest}
                onEntryComplete={handleGalaxyEntryComplete}
              />
            ) : (
              <SelectionCameraControls
                viewLevel={viewLevel}
                viewKey={viewKey}
                viewData={viewData}
                contentRef={sceneContentRef}
                selectedTrackId={selectedTrack?.id ?? null}
              />
            )}

            <group ref={sceneContentRef}>
              {/* Universe view: render one galaxy per artist. */}
              {!activeArtist &&
                artists.map((artist, index) => {
                  const radius =
                    MIN_RADIUS +
                    (MAX_RADIUS - MIN_RADIUS) * (artist.artistWeight ?? 0);

                  return (
                    <ArtistGalaxy
                      key={artist.id}
                      artist={artist}
                      position={getArtistPosition(index)}
                      radius={radius}
                      isSelected={selectedArtist?.id === artist.id}
                      onSelect={handleArtistClick}
                    />
                  );
                })}

              {/* Keep releases at the same position and scale when entering a system. */}
              {activeArtist &&
                releases.map((release, index) => {
                  const isActiveRelease = selectedRelease?.id === release.id;

                  if (selectedRelease && !isActiveRelease) return null;

                  return (
                    <group
                      key={release.id}
                      position={getReleasePosition(index)}
                      scale={RELEASE_OVERVIEW_SCALE}
                    >
                      <ReleaseSystem
                        release={release}
                        minRadius={MIN_RADIUS}
                        maxRadius={MAX_RADIUS}
                        selectedTrackId={
                          isActiveRelease ? (selectedTrack?.id ?? null) : null
                        }
                        onSunClick={() => {
                          if (isActiveRelease) {
                            handleBackToSystem();
                          } else {
                            handleReleaseClick(release);
                          }
                        }}
                        onTrackClick={(track) => {
                          if (!isActiveRelease) {
                            handleReleaseClick(release);
                          }

                          handleTrackClick(track);
                        }}
                        illuminate={isActiveRelease}
                        showSongLabels={isActiveRelease}
                      />
                    </group>
                  );
                })}
            </group>

            {/* Base lighting remains available in every scene context. */}
            <ambientLight intensity={0.3} />
            <directionalLight position={[3, 3, 3]} />
          </Canvas>
        </div>
      </div>
    </div>
  );
}

// Export UniverseScene for use in App.jsx.
export default UniverseScene;
