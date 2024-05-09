/**
 * Get a spotify token for the given client id and secret, returns undefined if the request fails
 * @param {string} spotifyClientId the client id of the spotify app
 * @param {string} spotifyClientSecret the client secret of the spotify app
 * @returns {Promise<string | undefined>} token or undefined
 */
export const getAuthToken = async (
  spotifyClientId: string,
  spotifyClientSecret: string
): Promise<string | undefined> => {
  // Auth header and options for the spotify token request
  const authUrl = new URL('https://accounts.spotify.com/api/token');
  const authOptions: RequestInit = {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${spotifyClientId}:${spotifyClientSecret}`).toString(
        'base64'
      )}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  };

  // Request the token
  const res = await fetch(authUrl, authOptions);
  if (!res.ok) {
    return undefined;
  }
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
};

/**
 * Generate an access token using the refresh token, returns undefined if the request fails
 * @param {string} spotifyClientId the client id of the spotify app
 * @param {string} spotifyClientSecret the client secret of the spotify app
 * @param {string} spotifyRefreshToken the refresh token of the spotify app
 * @returns {Promise<string | undefined>} access token or undefined
 */
export const getAccessToken = async (
  spotifyClientId: string,
  spotifyClientSecret: string,
  spotifyRefreshToken: string
): Promise<string | undefined> => {
  const accessUrl = new URL('https://accounts.spotify.com/api/token');
  const accessOptions = {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${spotifyClientId}:${spotifyClientSecret}`).toString(
        'base64'
      )}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `grant_type=refresh_token&refresh_token=${spotifyRefreshToken}`,
  };

  const res = await fetch(accessUrl, accessOptions);
  if (!res.ok) {
    return undefined;
  }
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
};

/**
 * Get the user id from spotify using its access token
 * @param accessToken spotify access token
 * @returns {string | undefined} user id or undefined
 */
export const getUserId = async (accessToken: string): Promise<string | undefined> => {
  const userUrl = new URL('https://api.spotify.com/v1/me');
  const userOptions: RequestInit = {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  };

  const res = await fetch(userUrl, userOptions);
  if (!res.ok) {
    return undefined;
  }
  const data = (await res.json()) as { id: string };
  return data.id;
};
