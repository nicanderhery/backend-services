import { loadEnv } from '@/lib/env-validator';
import { getCurrentRoute } from '@/lib/route-registar';
import { getRefreshToken } from '@/lib/spotify/load-token';
import { generateRandomString } from '@/lib/spotify/randomizer';
import { redirect } from 'next/navigation';

export function GET() {
  const refreshToken = getRefreshToken();

  const route = getCurrentRoute();
  const redirectUri = `${loadEnv().SERVER_ADDRESS}${route?.replace('login', 'callback')}`;

  if (refreshToken) {
    return redirect(redirectUri);
  }

  const state = generateRandomString(16);

  // Request authorization from spotify with the following scopes
  const scope = 'playlist-modify-private playlist-read-private ';

  const authUrl = new URL('https://accounts.spotify.com/authorize');
  const authParams = new URLSearchParams({
    response_type: 'code',
    client_id: loadEnv().SPOTIFY_CLIENT_ID,
    scope,
    redirect_uri: redirectUri,
    state,
  });
  authUrl.search = authParams.toString();
  return redirect(authUrl.toString());
}
