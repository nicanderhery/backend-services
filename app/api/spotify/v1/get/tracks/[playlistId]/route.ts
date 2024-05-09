import { SpotifyTrack } from '@/interfaces/spotify/track';
import { SpotifyTrackResponse } from '@/interfaces/spotify/track-response';
import { loadEnv } from '@/lib/env-validator';
import { getAuthToken } from '@/lib/spotify/auth';
import { NextRequest, NextResponse } from 'next/server';

type Params = {
  playlistId: string;
};

export async function GET(req: NextRequest, context: { params: Params }) {
  const { playlistId } = context.params;
  const authToken = await getAuthToken(
    loadEnv().SPOTIFY_CLIENT_ID,
    loadEnv().SPOTIFY_CLIENT_SECRET
  );
  if (!authToken) {
    return NextResponse.json({ message: 'Failed to get auth token' }, { status: 500 });
  }

  const trackUrl = new URL(`https://api.spotify.com/v1/playlists/${playlistId}`);
  const trackOptions: RequestInit = {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  };
  const tracks = await getTracks(trackUrl, trackOptions, 0, 0, []);
  if (tracks.length === 0) {
    return NextResponse.json({ message: 'Failed to get tracks' }, { status: 500 });
  }
  const trackUris = tracks.map((track) => track.uri);
  return NextResponse.json(trackUris);
}

/**
 * Get all tracks from the given playlist, returns an empty array if the request fails
 * @param trackUrl the url to the playlist
 * @param trackOptions the options for the request
 * @param trackLeft the amount of tracks left to fetch
 * @param i the current iteration
 * @param spotifyTracks the array of tracks
 * @returns {Promise<SpotifyTrack[]>} the array of tracks
 */
const getTracks = async (
  trackUrl: URL,
  trackOptions: RequestInit,
  trackLeft: number,
  i: number,
  spotifyTracks: SpotifyTrack[]
): Promise<SpotifyTrack[]> => {
  // Fetch the tracks
  const response = await fetch(trackUrl.toString(), trackOptions);
  if (!response.ok) {
    return spotifyTracks;
  }

  const body = (await response.json()) as SpotifyTrackResponse;

  // If it is the first iteration, get the total amount of tracks
  if (i === 0) {
    trackLeft = body.tracks.total;
  }
  if (trackLeft <= 0) {
    return spotifyTracks;
  }

  // Add the tracks to the array
  if (i > 0) {
    for (const track of body.items) {
      spotifyTracks.push(track.track);
      trackLeft -= 1;
    }
  } else {
    for (const track of body.tracks.items) {
      spotifyTracks.push(track.track);
      trackLeft -= 1;
    }
  }

  // If there are more tracks, get the next page
  if (trackLeft > 0) {
    const nextUrl = i > 0 ? new URL(body.next) : new URL(body.tracks.next);
    return getTracks(nextUrl, trackOptions, trackLeft, i + 1, spotifyTracks);
  }

  return spotifyTracks;
};
