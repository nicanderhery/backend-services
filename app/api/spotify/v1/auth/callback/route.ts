import { loadEnv } from '@/lib/env-validator';
import { getCurrentRoute } from '@/lib/route-registar';
import { getRefreshToken, setRefreshToken } from '@/lib/spotify/load-token';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const refreshToken = getRefreshToken();
  if (refreshToken) {
    return NextResponse.json({ message: 'Refresh token already exists' });
  }

  const state = req.nextUrl.searchParams.get('state');
  const code = req.nextUrl.searchParams.get('code');

  if (!state || !code) {
    return NextResponse.json({ message: 'Missing state or code' }, { status: 400 });
  }

  // Request a refresh token from spotify
  const route = getCurrentRoute();
  const redirectUri = `${loadEnv().SERVER_ADDRESS}${route?.replace('login', 'callback')}`;
  const refreshUrl = new URL('https://accounts.spotify.com/api/token');
  const refreshOption: RequestInit = {
    method: 'POST',
    body: new URLSearchParams({
      code,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
    headers: {
      Authorization: `Basic ${Buffer.from(
        `${loadEnv().SPOTIFY_CLIENT_ID}:${loadEnv().SPOTIFY_CLIENT_SECRET}`
      ).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  };

  const response = await fetch(refreshUrl, refreshOption);
  if (!response.ok) {
    return NextResponse.json({ message: 'Failed to get refresh token' }, { status: 500 });
  }

  const data = (await response.json()) as {
    refresh_token: string;
  };
  const newRefreshToken = data.refresh_token;
  setRefreshToken(newRefreshToken);
  return NextResponse.json({ message: 'Successfully got a refresh token' });
}
