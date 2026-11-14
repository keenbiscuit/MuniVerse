import "./App.css";
import { useState, useEffect } from "react";
import UniverseScene from "./UniverseScene";

function App() {
  const [artists, setArtists] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [authStatus, setAuthStatus] = useState("checking");
  const [authError, setAuthError] = useState(null);

  // Keep data-loading settings in App.
  const [timeRange, setTimeRange] = useState("short_term");

  // Artist whose galaxy is currently open.
  const [activeArtist, setActiveArtist] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    async function checkSpotifyConnection() {
      try {
        const response = await fetch("/spotify/auth/status", {
          signal: controller.signal,
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`Connection check failed: ${response.status}`);
        }

        const data = await response.json();

        if (typeof data.connected !== "boolean") {
          throw new Error("Invalid connection-status response");
        }

        setAuthStatus(data.connected ? "connected" : "disconnected");
      } catch (error) {
        if (controller.signal.aborted) return;

        console.error("Spotify connection check failed:", error);
        setAuthStatus("error");
        setAuthError(
          "Could not check your Spotify connection. Refresh the page to try again.",
        );
      }
    }

    checkSpotifyConnection();

    return () => {
      controller.abort();
    };
  }, []);

  // Changing the range clears the previous universe.
  function handleTimeRangeChange(nextTimeRange) {
    setTimeRange(nextTimeRange);
    setActiveArtist(null);
    setArtists([]);
    setError(null);
    setHasLoaded(false);
  }

  // Load the universe for the currently selected range.
  async function handleLoadUniverse() {
    if (authStatus !== "connected" || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/spotify/universe?timeRange=${timeRange}`);

      if (!response.ok) {
        if (response.status === 429) {
          const failure = await response.json().catch(() => null);

          setError(
            typeof failure?.message === "string"
              ? failure.message
              : "Spotify's API request limit or quota has been reached. Please try again later.",
          );

          return;
        }

        throw new Error(`Universe request failed: ${response.status}`);
      }

      const data = await response.json();

      if (!Array.isArray(data.artists)) {
        throw new Error("Universe response did not contain an artists array");
      }

      setArtists(data.artists);
      setHasLoaded(true);
    } catch (error) {
      console.error("Fetch Error:", error);
      setError("Could not load your universe. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main>
      <UniverseScene
        authStatus={authStatus}
        authError={authError}
        key={timeRange}
        artists={artists}
        activeArtist={activeArtist}
        setActiveArtist={setActiveArtist}
        timeRange={timeRange}
        isLoading={isLoading}
        hasLoaded={hasLoaded}
        error={error}
        onTimeRangeChange={handleTimeRangeChange}
        onLoadUniverse={handleLoadUniverse}
      />
    </main>
  );
}

export default App;
