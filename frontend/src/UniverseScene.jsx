import { Canvas } from "@react-three/fiber";
import { useState } from "react";

// Define UniverseScene using artist data and active-artist state from App.jsx
function UniverseScene({ artists, activeArtist, setActiveArtist }) {
  // Artist selected in the universe
  const [selectedArtist, setSelectedArtist] = useState(null);

  // Release selected inside the active artist galaxy
  const [selectedRelease, setSelectedRelease] = useState(null);

  // Track selected inside the release system
  const [selectedTrack, setSelectedTrack] = useState(null);

  // Select an artist without entering their galaxy
  function handleArtistClick(artist) {
    setSelectedArtist(artist);
    setSelectedRelease(null);
    setSelectedTrack(null);
  }

  // Clear the current selection when clicking empty space
  function handleClearSelection() {
    if (activeArtist) {
      setSelectedTrack(null);
    } else {
      setSelectedArtist(null);
      setSelectedRelease(null);
      setSelectedTrack(null);
    }
  }

  // Return to the universe and clear all selections
  function handleBackToUniverse() {
    setActiveArtist(null);
    setSelectedArtist(null);
    setSelectedRelease(null);
    setSelectedTrack(null);
  }

  // Enter an artist galaxy and clear previous release and track selections
  function handleExploreArtistClick(artist) {
    setActiveArtist(artist);
    setSelectedRelease(null);
    setSelectedTrack(null);
  }

  // Enter one release system and clear the previous track selection
  function handleReleaseClick(release) {
    setSelectedRelease(release);
    setSelectedTrack(null);
  }

  // Select a song planet
  function handleTrackClick(track) {
    setSelectedTrack(track);
  }

  // Return to the active artist's release systems
  function handleBackToArtist() {
    setSelectedRelease(null);
    setSelectedTrack(null);
  }

  // Show the active artist when exploring, otherwise the selected artist
  const displayedArtist = activeArtist ?? selectedArtist;

  // Read releases and tracks for the current navigation level
  const releases = activeArtist?.releases ?? [];
  const tracks = selectedRelease?.tracks ?? [];

  // Build the selected release's display label
  let releaseLabel = "";

  if (selectedRelease?.album_type === "album") {
    releaseLabel = "Album: " + selectedRelease.name;
  } else if (selectedRelease?.album_type === "single") {
    releaseLabel = "Single: " + selectedRelease.name;
  } else if (selectedRelease?.album_type === "compilation") {
    releaseLabel = "Compilation: " + selectedRelease.name;
  }

  // Read the first release image when one exists
  const trackImageUrl = selectedRelease?.images?.[0]?.url;

  // Define visual size limits separately from backend weights
  const minRadius = 0.6;
  const maxRadius = 1.4;

  // Leave a gap between neighboring spheres at the maximum radius
  const sphereSpacing = 2 * maxRadius + 0.5;

  return (
    <div className="universe-canvas">
      {/* Artist, release, and selected-track details */}
      <section className="artist-details">
        <h2>{displayedArtist ? displayedArtist.name : "Select an Artist"}</h2>

        {displayedArtist && (
          <div className="artist-actions">
            {/* Show artist artwork only when an image URL exists */}
            {displayedArtist.images?.[0]?.url && (
              <img
                src={displayedArtist.images[0].url}
                alt={displayedArtist.name}
                width={100}
              />
            )}

            {/* Enter the artist galaxy from the universe */}
            {!activeArtist && selectedArtist && (
              <button
                type="button"
                onClick={() => handleExploreArtistClick(selectedArtist)}
              >
                Explore Artist Galaxy
              </button>
            )}

            {/* Handle artists without matching returned top tracks */}
            {activeArtist && !selectedRelease && releases.length === 0 && (
              <p>No songs from this artist in your returned top tracks.</p>
            )}

            {/* Prompt the user to choose a release */}
            {activeArtist && !selectedRelease && releases.length > 0 && (
              <p>Select a release system.</p>
            )}

            {/* Show the selected release's label and artwork */}
            {selectedRelease && (
              <>
                <p>{releaseLabel || selectedRelease.name}</p>

                {trackImageUrl && (
                  <img
                    src={trackImageUrl}
                    alt={selectedRelease.name}
                    width={100}
                  />
                )}
              </>
            )}

            {/* Show the selected track and all credited artists */}
            {selectedTrack && (
              <>
                <p>{selectedTrack.name}</p>
                <p>
                  {selectedTrack.artists
                    .map((artist) => artist.name)
                    .join(", ")}
                </p>
              </>
            )}
          </div>
        )}
      </section>

      <div className="universe-canvas">
        {/* Return from any artist view to the universe */}
        {activeArtist && (
          <button type="button" onClick={handleBackToUniverse}>
            Back to Universe
          </button>
        )}

        {/* Return from a release system to the artist galaxy */}
        {activeArtist && selectedRelease && (
          <button type="button" onClick={handleBackToArtist}>
            Back to Artist Galaxy
          </button>
        )}

        {/* Temporary camera framing for the current row layout */}
        <Canvas
          camera={{ position: [0, 0, 20], fov: 40 }}
          onPointerMissed={handleClearSelection}
        >
          {/* Universe view: render one sphere per artist */}
          {!activeArtist &&
            artists.map((artist, index) => {
              // Map artist weight to a bounded visual radius
              const artistWeight = artist.artistWeight ?? 0;
              const radius = minRadius + (maxRadius - minRadius) * artistWeight;

              return (
                <mesh
                  key={artist.id}
                  onClick={(event) => {
                    event.stopPropagation();
                    handleArtistClick(artist);
                  }}
                  position={[
                    (index - (artists.length - 1) / 2) * sphereSpacing,
                    0,
                    0,
                  ]}
                >
                  <sphereGeometry args={[radius, 32, 32]} />
                  <meshStandardMaterial
                    color={selectedArtist?.id === artist.id ? "cyan" : "orange"}
                  />
                </mesh>
              );
            })}

          {/* Artist galaxy view: render one sphere per release */}
          {activeArtist &&
            !selectedRelease &&
            releases.map((release, index) => (
              <mesh
                key={release.id}
                onClick={(event) => {
                  event.stopPropagation();
                  handleReleaseClick(release);
                }}
                position={[
                  (index - (releases.length - 1) / 2) * sphereSpacing,
                  0,
                  0,
                ]}
              >
                {/* Release systems use a fixed size for now */}
                <sphereGeometry args={[0.8, 32, 32]} />
                <meshStandardMaterial color="orange" />
              </mesh>
            ))}

          {/* Release system view: render its returned top tracks */}
          {activeArtist &&
            selectedRelease &&
            tracks.map((track, index) => {
              // Map track weight independently to a bounded radius
              const trackWeight = track.trackWeight ?? 0;
              const radius = minRadius + (maxRadius - minRadius) * trackWeight;

              return (
                <mesh
                  key={track.id}
                  onClick={(event) => {
                    event.stopPropagation();
                    handleTrackClick(track);
                  }}
                  position={[
                    (index - (tracks.length - 1) / 2) * sphereSpacing,
                    0,
                    0,
                  ]}
                >
                  <sphereGeometry args={[radius, 32, 32]} />
                  <meshStandardMaterial
                    color={selectedTrack?.id === track.id ? "purple" : "maroon"}
                  />
                </mesh>
              );
            })}

          {/* Scene lighting */}
          <ambientLight intensity={0.3} />
          <directionalLight position={[3, 3, 3]} />
        </Canvas>
      </div>
    </div>
  );
}

// Export UniverseScene for use in App.jsx
export default UniverseScene;
