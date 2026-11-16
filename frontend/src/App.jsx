import "./App.css";
import { useState, useEffect, useRef } from "react";
import UniverseScene from "./UniverseScene";
import { createSampleUniverse } from "./data/SampleUniverse";

function App() {
  const [artists, setArtists] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [authStatus, setAuthStatus] = useState("checking");
  const [authError, setAuthError] = useState(null);
  const [universeSource, setUniverseSource] = useState("spotify");
  const [sceneVersion, setSceneVersion] = useState(0);

  // Keep data-loading settings in App.
  const [timeRange, setTimeRange] = useState("short_term");

  // Artist whose galaxy is currently open.
  const [activeArtist, setActiveArtist] = useState(null);

  const universeRequestRef = useRef(null);

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

  useEffect(() => {
    return () => {
      universeRequestRef.current?.abort();
    };
  }, []);

  function cancelUniverseRequest() {
    universeRequestRef.current?.abort();
    universeRequestRef.current = null;
  }

  function handleLoadSampleUniverse() {
    cancelUniverseRequest();

    setUniverseSource("sample");
    setActiveArtist(null);
    setArtists(createSampleUniverse());
    setError(null);
    setIsLoading(false);
    setHasLoaded(true);
    setSceneVersion((version) => version + 1);
  }

  function handleUseSpotify() {
    cancelUniverseRequest();

    setUniverseSource("spotify");
    setActiveArtist(null);
    setArtists([]);
    setError(null);
    setIsLoading(false);
    setHasLoaded(false);
    setSceneVersion((version) => version + 1);
  }

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
    if (
      universeSource !== "spotify" ||
      authStatus !== "connected" ||
      isLoading
    ) {
      return;
    }

    cancelUniverseRequest();

    const controller = new AbortController();
    universeRequestRef.current = controller;

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
      setActiveArtist(null);
      setHasLoaded(true);
      setSceneVersion((version) => version + 1);
    } catch (error) {
      console.error("Fetch Error:", error);
      setError("Could not load your universe. Please try again.");
    } finally {
      if (universeRequestRef.current === controller) {
        universeRequestRef.current = null;
        setIsLoading(false);
      }
    }
  }

  return (
    <main>
      <UniverseScene
        key={`${universeSource}:${timeRange}:${sceneVersion}`}
        onLoadSampleUniverse={handleLoadSampleUniverse}
        onUseSpotify={handleUseSpotify}
        universeSource={universeSource}
        authStatus={authStatus}
        authError={authError}
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
