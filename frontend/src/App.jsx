import "./App.css";
import UniverseScene from "./UniverseScene";
import { useState } from "react";

function App() {
  const [artists, setArtists] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  // remove loading button when artists are selected? would need back to start button to load again or browser refresh
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(null);

  // Artist who's system we've entered
  const [activeArtist, setActiveArtist] = useState(null);

  // Load universe
  async function hanldeLoadUniverse() {
    setIsLoading(true);

    setError(null);

    try {
      const response = await fetch("/spotify/universe");

      // Check if response was okay
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const data = await response.json();
      console.log(data);
      setArtists(data["artists"]);
    } catch (error) {
      console.error("Fetch Error: ", error);
      setError("Could not load artists. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <main>
        <h1> Your Spotify Universe </h1>
        <p> Your Top Spotify Artist By Affinity</p>
        {activeArtist === null && (
          <button disabled={isLoading} onClick={hanldeLoadUniverse}>
            {isLoading ? "Loading Artists" : "Load Artists"}
          </button>
        )}
        {error && <p>{error}</p>}
        <UniverseScene
          activeArtist={activeArtist}
          setActiveArtist={setActiveArtist}
          artists={artists}
        >
          {" "}
        </UniverseScene>
      </main>
    </>
  );
}

export default App;
