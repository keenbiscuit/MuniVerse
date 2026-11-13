import "./App.css";
import { useState } from "react";
import UniverseScene from "./UniverseScene";

function App() {
  const [artists, setArtists] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Keep data-loading settings in App.
  const [timeRange, setTimeRange] = useState("short_term");

  // Artist whose galaxy is currently open.
  const [activeArtist, setActiveArtist] = useState(null);

  // Changing the range clears the previous universe.
  function handleTimeRangeChange(nextTimeRange) {
    setTimeRange(nextTimeRange);
    setActiveArtist(null);
    setArtists([]);
    setError(null);
  }

  // Load the universe for the currently selected range.
  async function handleLoadUniverse() {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/spotify/universe?timeRange=${timeRange}`);

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const data = await response.json();

      setArtists(data.artists);
    } catch (error) {
      console.error("Fetch Error:", error);
      setError("Could not load artists. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main>
      <UniverseScene
        key={timeRange}
        artists={artists}
        activeArtist={activeArtist}
        setActiveArtist={setActiveArtist}
        timeRange={timeRange}
        isLoading={isLoading}
        error={error}
        onTimeRangeChange={handleTimeRangeChange}
        onLoadUniverse={handleLoadUniverse}
      />
    </main>
  );
}

export default App;
