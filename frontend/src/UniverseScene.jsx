import { Canvas } from "@react-three/fiber";
import { useState } from "react";

// Define UniverseScene component given artist prop from App.jsx
function UniverseScene({ artists, activeArtist, setActiveArtist }) {
  const [selectedArtist, setSelectedArtist] = useState(null);
  const [selectedRelease, setSelectedRelease] = useState(null);

  // Which track we selected
  const [selectedTrack, setSelectedTrack] = useState(null);

  // Make the sphere clickable
  function handleArtistClick(artist) {
    setSelectedArtist(artist);
    setSelectedRelease(artist.releases);
  }

  // Deselect artist on clear space click
  function handeClearSelection() {
    if (activeArtist) {
      setSelectedTrack(null);
    } else {
      setSelectedArtist(null);
      setSelectedRelease(null);
    }
  }

  // Go back to universe from solarSystem
  function handleBackToUniverse() {
    setActiveArtist(null);
    setSelectedArtist(null);
    setSelectedRelease(null);
    setSelectedTrack(null);
  }

  // Exploring artists songs
  function handleExploreArtistClick(artist) {
    setActiveArtist(artist);
  }

  function handleTrackClick(track) {
    setSelectedTrack(track);
  }

  // Gather tracks into a single array
  function handleTrackGrouping(activeArtist) {
    if (activeArtist === null) {
      return [];
    }
    let trackList = [];
    let count = 0;
    for (let index = 0; index < activeArtist?.releases?.length; index++) {
      activeArtist.releases[index].tracks.forEach((element) => {
        trackList[count++] = element;
      });
    }
    return trackList;
  }

  // Get Track release
  let activeTracks = handleTrackGrouping(activeArtist);

  let selectedTrackRelease = null;
  let releaseType = "";

  if (selectedTrack) {
    for (let index = 0; index < activeArtist?.releases?.length; index++) {
      activeArtist.releases[index].tracks.forEach((element) => {
        if (element.id === selectedTrack.id) {
          selectedTrackRelease = activeArtist.releases[index];
          releaseType = activeArtist.releases[index].album_type;
        }
      });
    }
  }

  // Get project type for label
  let releaseLabel = "";

  if (releaseType === "album") {
    releaseLabel = "Album: " + selectedTrackRelease.name;
  } else if (releaseType === "single") {
    releaseLabel = "Single";
  } else if (releaseType === "compilation") {
    releaseLabel = "Compilation: " + selectedTrackRelease.name;
  }

  let trackImageUrl = "";
  if (selectedTrackRelease?.images) {
    trackImageUrl = selectedTrackRelease.images[0].url;
  }

  return (
    <div className="universe-canvas">
      <section className="artist-details">
        <h2>{selectedArtist ? selectedArtist.name : "Select an Artist"}</h2>

        {selectedArtist && (
          <>
            <div className="artist-actions">
              {selectedArtist.images?.[0]?.url && (
                <img
                  src={selectedArtist.images[0].url}
                  alt={selectedArtist.name}
                  width={100}
                />
              )}

              {activeArtist === null && selectedArtist && (
                <button
                  type="button"
                  onClick={() => handleExploreArtistClick(selectedArtist)}
                >
                  Explore Artist System
                </button>
              )}
              {selectedTrack && (
                <>
                  <p>{selectedTrack.name}</p>
                  <p>
                    {selectedTrack.artists
                      .map((artist) => artist.name)
                      .join(", ")}
                  </p>
                  {releaseLabel && <p>{releaseLabel}</p>}
                  <p>
                    <img
                      src={trackImageUrl}
                      alt={selectedArtist.name}
                      width={100}
                    />
                  </p>
                </>
              )}
            </div>
          </>
        )}
      </section>

      <div className="universe-canvas">
        {activeArtist && (
          <button type="button" onClick={() => handleBackToUniverse()}>
            Back to Universe
          </button>
        )}
        <Canvas onPointerMissed={handeClearSelection}>
          {!activeArtist &&
            artists.map((artist, index) => (
              <mesh
                key={artist.id}
                onClick={(event) => {
                  event.stopPropagation();
                  handleArtistClick(artist);
                }}
                position={[(index - (artists.length - 1) / 2) * 2.5, 0, 0]}
              >
                <sphereGeometry />
                <meshStandardMaterial
                  color={selectedArtist?.id === artist.id ? "cyan" : "orange"}
                />
              </mesh>
            ))}
          {activeArtist &&
            activeTracks.map((track, index) => (
              <mesh
                key={track.id}
                onClick={(event) => {
                  event.stopPropagation();
                  handleTrackClick(track);
                }}
                position={[(index - (activeTracks.length - 1) / 2) * 2.5, 0, 0]}
              >
                <sphereGeometry />
                <meshStandardMaterial
                  color={selectedTrack?.id === track.id ? "Purple" : "Maroon"}
                />
              </mesh>
            ))}

          <ambientLight intensity={0.3} />
          <directionalLight position={[3, 3, 3]} />
        </Canvas>
      </div>
    </div>
  );
}

// Export UniverseScence component
export default UniverseScene;
