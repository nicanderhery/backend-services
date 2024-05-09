import { SpotifyPlaylist } from '@/interfaces/spotify/playlist';
import { loadEnv } from '@/lib/env-validator';
import { getAccessToken, getUserId } from '@/lib/spotify/auth';
import { getRefreshToken } from '@/lib/spotify/load-token';
import { generateRandomString } from '@/lib/spotify/randomizer';
import { NextResponse } from 'next/server';

export async function GET() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    return NextResponse.json({ message: 'No refresh token found' }, { status: 500 });
  }

  const accessToken = await getAccessToken(
    loadEnv().SPOTIFY_CLIENT_ID,
    loadEnv().SPOTIFY_CLIENT_SECRET,
    refreshToken
  );
  if (!accessToken) {
    return NextResponse.json({ message: 'Failed to get access token' }, { status: 500 });
  }

  const userId = await getUserId(accessToken);
  if (!userId) {
    return NextResponse.json({ message: 'Failed to get user id' }, { status: 500 });
  }

  const playlistId = generateRandomString(32);
  const playlistUrl = new URL(`https://api.spotify.com/v1/users/${userId}/playlists`);
  const playlistOptions: RequestInit = {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: playlistId,
      description: playlistId,
      public: false,
    }),
  };

  const response = await fetch(playlistUrl, playlistOptions);
  if (!response.ok) {
    return NextResponse.json({ message: 'Failed to create playlist' }, { status: 500 });
  }

  const data = (await response.json()) as {
    id: string;
    external_urls: { spotify: string };
  };

  const playlist: SpotifyPlaylist = {
    id: data.id,
    url: data.external_urls.spotify,
  };

  // Unsubscribe the playlist from the user, because the playlist is still there even if no user is subscribed to it
  const deleteUrl = new URL(`https://api.spotify.com/v1/playlists/${playlist.id}/followers`);
  const deleteOptions: RequestInit = {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  };
  await fetch(deleteUrl, deleteOptions);

  return NextResponse.json(playlist);
}
