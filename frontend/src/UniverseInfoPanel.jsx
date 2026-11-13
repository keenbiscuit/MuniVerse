export default function UniverseInfoPanel({
  startingArtist,
  selectedArtist,
  activeArtist,
  selectedRelease,
  selectedTrack,
  entryRequest,
  timeRange,
  isLoading,
  error,
  onTimeRangeChange,
  onLoadUniverse,
  onBackToUniverse,
  onBackToArtist,
  onBackToSystem,
}) {
  const artist = activeArtist ?? selectedArtist ?? startingArtist;

  const releases = activeArtist?.releases ?? [];

  const returnedSongCount = releases.reduce(
    (total, release) => total + (release.tracks?.length ?? 0),
    0,
  );

  const context = selectedTrack
    ? "Song"
    : selectedRelease
      ? "Release system"
      : activeArtist
        ? "Artist galaxy"
        : "Your universe";

  const title = selectedTrack
    ? selectedTrack.name
    : selectedRelease
      ? selectedRelease.name
      : activeArtist
        ? activeArtist.name
        : entryRequest
          ? `Entering ${entryRequest.artist.name}`
          : "Explore your music";

  // One primary image: release artwork takes precedence.
  const imageUrl = selectedRelease
    ? selectedRelease.images?.[0]?.url
    : artist?.images?.[0]?.url;

  const imageAlt = selectedRelease
    ? `${selectedRelease.name} artwork`
    : artist
      ? `${artist.name} artwork`
      : "";

  const releaseType = selectedRelease?.album_type?.replaceAll("_", " ");

  return (
    <aside className="universe-info-panel" aria-label="Universe information">
      <header className="universe-info-header">
        <p className="universe-info-context">{context}</p>
        <h2>{title}</h2>

        {selectedRelease && artist && (
          <p className="universe-info-subtitle">{artist.name}</p>
        )}
      </header>

      {/* Universe settings stay available in every navigation context. */}
      <section
        className="universe-info-settings"
        aria-label="Universe settings"
      >
        <label htmlFor="time-range">Time range</label>

        <select
          id="time-range"
          value={timeRange}
          disabled={isLoading || Boolean(entryRequest)}
          onChange={(event) => {
            onTimeRangeChange(event.target.value);
          }}
        >
          <option value="short_term">Short term</option>
          <option value="medium_term">Medium term</option>
          <option value="long_term">Long term</option>
        </select>

        {!activeArtist && (
          <button
            type="button"
            disabled={isLoading || Boolean(entryRequest)}
            onClick={onLoadUniverse}
          >
            {isLoading ? "Loading Universe…" : "Load Universe"}
          </button>
        )}

        {isLoading && (
          <p className="universe-info-status" role="status">
            Building your universe…
          </p>
        )}

        {error && (
          <p className="universe-info-error" role="alert">
            {error}
          </p>
        )}
      </section>

      {imageUrl && (
        <img className="universe-info-artwork" src={imageUrl} alt={imageAlt} />
      )}

      <div className="universe-info-content">
        {!activeArtist && (
          <>
            <p>
              Starting near <span>{startingArtist?.name ?? "your music"}</span>.
            </p>

            {selectedArtist && !entryRequest && (
              <p>Selected artist: {selectedArtist.name}</p>
            )}

            <p>
              Travel between galaxies, then click one to explore its release
              systems.
            </p>
          </>
        )}

        {activeArtist && !selectedRelease && (
          <>
            <dl className="universe-info-facts">
              <div>
                <dt>Returned release systems</dt>
                <dd>{releases.length}</dd>
              </div>

              <div>
                <dt>Returned songs</dt>
                <dd>{returnedSongCount}</dd>
              </div>
            </dl>

            <p>
              {releases.length > 0
                ? "Select a sun or planet to open its release system."
                : "No songs from this artist are available in the returned tracks."}
            </p>
          </>
        )}

        {selectedRelease && !selectedTrack && (
          <>
            <dl className="universe-info-facts">
              <div>
                <dt>Release type</dt>
                <dd>{releaseType || "Release"}</dd>
              </div>

              <div>
                <dt>Returned songs</dt>
                <dd>{selectedRelease.tracks?.length ?? 0}</dd>
              </div>
            </dl>

            <p>Select a planet to inspect its song.</p>
          </>
        )}

        {selectedTrack && (
          <>
            <p className="universe-info-credits">
              {(selectedTrack.artists ?? [])
                .map((creditedArtist) => creditedArtist.name)
                .join(", ")}
            </p>

            <dl className="universe-info-facts">
              <div>
                <dt>Release</dt>
                <dd>{selectedRelease?.name ?? "Unknown"}</dd>
              </div>
            </dl>

            <p>
              Each planet represents a song in the returned listening-profile
              data.
            </p>
          </>
        )}
      </div>

      {activeArtist && (
        <nav
          className="universe-info-navigation"
          aria-label="Universe navigation"
        >
          {selectedTrack && (
            <button type="button" onClick={onBackToSystem}>
              Back to System
            </button>
          )}

          {selectedRelease && (
            <button type="button" onClick={onBackToArtist}>
              Back to Artist
            </button>
          )}

          <button type="button" onClick={onBackToUniverse}>
            Back to Universe
          </button>
        </nav>
      )}

      {!activeArtist && (
        <details className="universe-info-help">
          <summary>Travel controls</summary>

          <ul>
            <li>W / S — forward / backward</li>
            <li>A / D — move sideways</li>
            <li>Q / E — move down / up</li>
            <li>Shift — travel faster</li>
            <li>Shift + left-drag — look around</li>
            <li>Mouse wheel — move closer / farther</li>
            <li>Left-click a galaxy — enter</li>
          </ul>
        </details>
      )}

      <footer className="universe-info-note">
        <p>Sizes use relative rank-derived weights minutes.</p>
        <p>
          Each time range shows a separate Spotify ranking. Songs and artists
          may differ between ranges.
        </p>
        <p>Short Term: Approx. 4 Weeks</p>
        <p>Medium Term: Approx. 6 Months</p>
        <p>Long Term: Approx. 1 Year</p>
      </footer>
    </aside>
  );
}
