function createTrack(id, name, trackWeight) {
  return {
    id,
    name,
    trackWeight,
  };
}

function createRelease(id, name, trackNames) {
  return {
    id,
    name,
    tracks: trackNames.map((trackName, index) =>
      createTrack(
        `${id}-track-${index + 1}`,
        trackName,
        1 - index / Math.max(trackNames.length - 1, 1),
      ),
    ),
  };
}

export const sampleArtists = [
  {
    id: "sample-artist-neon-harbor",
    name: "Neon Harbor",
    artistWeight: 1,
    releases: [
      createRelease("sample-release-afterlight", "Afterlight", [
        "City Signals",
        "Glass Horizon",
        "Night Transit",
        "Electric Rain",
        "Last Train Home",
        "Blue Hour",
        "Distant Windows",
        "Afterlight",
      ]),
      createRelease("sample-release-static-bloom", "Static Bloom", [
        "Soft Voltage",
        "Satellite Hearts",
        "Flicker",
        "Static Bloom",
      ]),
    ],
  },
  {
    id: "sample-artist-juniper-echo",
    name: "Juniper Echo",
    artistWeight: 0.75,
    releases: [
      createRelease("sample-release-paper-mountains", "Paper Mountains", [
        "Morning Trail",
        "Juniper",
        "Paper Mountains",
        "River Letters",
        "Wildflower",
        "Northbound",
        "Home Again",
      ]),
      createRelease("sample-release-quiet-weather", "Quiet Weather", [
        "Porch Light",
        "Slow Clouds",
        "Quiet Weather",
        "Sunday Fields",
        "Open Door",
      ]),
    ],
  },
  {
    id: "sample-artist-velvet-current",
    name: "Velvet Current",
    artistWeight: 0.5,
    releases: [
      createRelease("sample-release-low-tide", "Low Tide", [
        "Undertow",
        "Velvet Room",
        "Low Tide",
        "Amber",
        "Side Streets",
        "Weightless",
      ]),
      createRelease("sample-release-indigo-hours", "Indigo Hours", [
        "First Light",
        "Indigo Hours",
        "Window Seat",
        "Stay Awhile",
      ]),
    ],
  },
  {
    id: "sample-artist-orbit-assembly",
    name: "Orbit Assembly",
    artistWeight: 0.25,
    releases: [
      createRelease("sample-release-distant-machines", "Distant Machines", [
        "Launch Sequence",
        "Relay",
        "Distant Machines",
        "Solar Drift",
        "Signal Loss",
        "Gravity Well",
        "Return Path",
        "Reentry",
        "Ground Control",
      ]),
      createRelease("sample-release-soft-landing", "Soft Landing", [
        "Cloudbreak",
        "Soft Landing",
        "Still Moving",
      ]),
    ],
  },
];

// Return fresh objects whenever the sample universe is opened.
export function createSampleUniverse() {
  return sampleArtists.map((artist) => ({
    ...artist,
    releases: artist.releases.map((release) => ({
      ...release,
      album_type: "album",
      tracks: release.tracks.map((track) => ({
        ...track,
        artists: [
          {
            id: artist.id,
            name: artist.name,
          },
        ],
      })),
    })),
  }));
}
