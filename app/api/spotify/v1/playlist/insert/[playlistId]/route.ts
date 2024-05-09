import { loadEnv } from '@/lib/env-validator';
import { getAccessToken } from '@/lib/spotify/auth';
import { getRefreshToken } from '@/lib/spotify/load-token';
import { NextRequest, NextResponse } from 'next/server';

type Params = {
  playlistId: string;
};

export async function POST(req: NextRequest, context: { params: Params }) {
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

  const { playlistId } = context.params;
  const trackUris = (await req.json()) as {
    uris: string[];
  };

  const insertUrl = new URL(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`);
  const insertOptions: RequestInit = {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(trackUris),
  };

  const response = await fetch(insertUrl, insertOptions);

  return NextResponse.json({ message: 'Tracks inserted' }, { status: response.status });
}
