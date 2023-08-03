import { RequestHandler, Router } from 'express';
import fs from 'fs';
import { SM } from '..';
import { SpotifyPlaylist } from './interfaces/playlist';
import { SpotifyTrack } from './interfaces/track';
import { SpotifyTrackResponse } from './interfaces/track-response';

const spotifyClientId = process.env.SPOTIFY_CLIENT_ID;
if (!spotifyClientId) {
    throw new Error('No spotify client id found');
}

const spotifyClientSecret = process.env.SPOTIFY_CLIENT_SECRET;
if (!spotifyClientSecret) {
    throw new Error('No spotify client secret found');
}

/**
 * Load the refresh token from the file
 * @returns {string | undefined} the refresh token or undefined
 */
const loadTokenFromFile = (): string | undefined => {
    try {
        return fs.readFileSync('./refresh_token', 'utf-8');
    } catch (error) {
        return undefined;
    }
};

let spotifyRefreshToken = loadTokenFromFile();
spotifyRefreshToken ? console.log('Loaded refresh token') : console.log('No refresh token found');

const baseUrl = SM.get('baseUrl');
if (!baseUrl) {
    throw new Error('No base url found');
}

const apiRoute = SM.get('apiRoute');
if (!apiRoute) {
    throw new Error('No api route found');
}

const router = Router({ mergeParams: true });

// Redirect to the latest version
router.get('/', (_req, res) => {
    res.redirect(`${apiRoute}/spotify/v1`);
});

router.get('/v1', (_req, res) => {
    res.status(200).send({ message: 'API v1' });
});

router.get('/v1/get/tracks/:playlistId', (async (req, res) => {
    const playlistId = req.params.playlistId;

    const authToken = await getAuthToken(spotifyClientId, spotifyClientSecret);
    if (!authToken) {
        return res.status(500).send({ message: 'Could not get auth token' });
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
        return res.status(500).send({ message: 'Could not get tracks' });
    }
    const trackUris = tracks.map((track) => track.uri);
    res.status(200).send(trackUris);
}) as RequestHandler);

router.get('/v1/playlist/create', (async (_req, res) => {
    if (!spotifyRefreshToken) {
        return res.status(500).send({ message: 'No refresh token found' });
    }

    const accessToken = await getAccessToken(
        spotifyClientId,
        spotifyClientSecret,
        spotifyRefreshToken,
    );
    if (!accessToken) {
        return res.status(500).send({ message: 'Could not get access token' });
    }

    const userId = await getUserId(accessToken);
    if (!userId) {
        return res.status(500).send({ message: 'Could not get user id' });
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
        return res.status(500).send({ message: 'Could not create playlist' });
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

    res.status(200).send(playlist);
}) as RequestHandler);

router.post('/v1/playlist/insert/:playlistId', (async (req, res) => {
    if (!spotifyRefreshToken) {
        return res.status(500).send({ message: 'No refresh token found' });
    }

    const accessToken = await getAccessToken(
        spotifyClientId,
        spotifyClientSecret,
        spotifyRefreshToken,
    );
    if (!accessToken) {
        return res.status(500).send({ message: 'Could not get access token' });
    }

    const playlistId = req.params.playlistId;
    const trackUris = req.body as {
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
    res.status(response.status).send(response.statusText);
}) as RequestHandler);

router.post('/v1/playlist/remove/:playlistId', (async (req, res) => {
    if (!spotifyRefreshToken) {
        return res.status(500).send({ message: 'No refresh token found' });
    }

    const accessToken = await getAccessToken(
        spotifyClientId,
        spotifyClientSecret,
        spotifyRefreshToken,
    );
    if (!accessToken) {
        return res.status(500).send({ message: 'Could not get access token' });
    }

    const playlistId = req.params.playlistId;
    const trackUris = req.body as {
        uris: string[];
    };
    const removeUrl = new URL(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`);
    const removeOptions: RequestInit = {
        method: 'DELETE',
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(trackUris),
    };

    const response = await fetch(removeUrl, removeOptions);
    res.status(response.status).send(response.statusText);
}) as RequestHandler);

router.get('/v1/auth/login', (_req, res) => {
    if (spotifyRefreshToken) {
        return res.redirect(`${baseUrl}${apiRoute}/spotify/v1/auth/callback`);
    }

    const redirectUri = `${baseUrl}${apiRoute}/spotify/v1/auth/callback`;
    const state = generateRandomString(16);

    // Request authorization from spotify with the following scopes
    const scope = 'playlist-modify-private playlist-read-private ';

    const authUrl = new URL('https://accounts.spotify.com/authorize');
    const authParams = new URLSearchParams({
        response_type: 'code',
        client_id: spotifyClientId,
        scope: scope,
        redirect_uri: redirectUri,
        state: state,
    });
    authUrl.search = authParams.toString();
    res.redirect(authUrl.toString());
});

router.get('/v1/auth/callback', (async (req, res) => {
    if (spotifyRefreshToken) {
        return res.status(200).send({ message: 'Refresh token already exists' });
    }

    const state = (req.query.state as string) || undefined;
    const code = (req.query.code as string) || undefined;

    // Check if the state and code are set
    if (state === undefined || code === undefined) {
        return res.status(500).send({ message: 'Failed to get a refresh token, please try again' });
    }

    // Request a refresh token from spotify
    const redirectUri = `${baseUrl}${apiRoute}/spotify/v1/auth/callback`;
    const refreshUrl = new URL('https://accounts.spotify.com/api/token');
    const refreshOption: RequestInit = {
        method: 'POST',
        body: new URLSearchParams({
            code: code,
            redirect_uri: redirectUri,
            grant_type: 'authorization_code',
        }),
        headers: {
            Authorization: `Basic ${Buffer.from(
                `${spotifyClientId}:${spotifyClientSecret}`,
            ).toString('base64')}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
    };

    const response = await fetch(refreshUrl, refreshOption);
    if (!response.ok) {
        return res.status(500).send({ message: 'Failed to get a refresh token, please try again' });
    }

    const data = (await response.json()) as {
        refresh_token: string;
    };
    const refreshToken = data.refresh_token;
    spotifyRefreshToken = refreshToken;
    fs.writeFileSync('./refresh_token', refreshToken, 'utf-8');
    res.status(200).send({ message: 'Successfully got a refresh token' });
}) as RequestHandler);

export default router;

/**
 * Get a spotify token for the given client id and secret, returns undefined if the request fails
 * @param {string} spotifyClientId the client id of the spotify app
 * @param {string} spotifyClientSecret the client secret of the spotify app
 * @returns {Promise<string | undefined>} token or undefined
 */
const getAuthToken = async (
    spotifyClientId: string,
    spotifyClientSecret: string,
): Promise<string | undefined> => {
    // Auth header and options for the spotify token request
    const authUrl = new URL('https://accounts.spotify.com/api/token');
    const authOptions: RequestInit = {
        method: 'POST',
        headers: {
            Authorization: `Basic ${Buffer.from(
                `${spotifyClientId}:${spotifyClientSecret}`,
            ).toString('base64')}`,
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
const getAccessToken = async (
    spotifyClientId: string,
    spotifyClientSecret: string,
    spotifyRefreshToken: string,
): Promise<string | undefined> => {
    const accessUrl = new URL('https://accounts.spotify.com/api/token');
    const accessOptions = {
        method: 'POST',
        headers: {
            Authorization: `Basic ${Buffer.from(
                `${spotifyClientId}:${spotifyClientSecret}`,
            ).toString('base64')}`,
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
    spotifyTracks: SpotifyTrack[],
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
            trackLeft--;
        }
    } else {
        for (const track of body.tracks.items) {
            spotifyTracks.push(track.track);
            trackLeft--;
        }
    }

    // If there are more tracks, get the next page
    if (trackLeft > 0) {
        const nextUrl = i > 0 ? new URL(body.next) : new URL(body.tracks.next);
        return await getTracks(nextUrl, trackOptions, trackLeft, ++i, spotifyTracks);
    } else {
        return spotifyTracks;
    }
};

/**
 * Get the user id from spotify using its access token
 * @param accessToken spotify access token
 * @returns {string | undefined} user id or undefined
 */
const getUserId = async (accessToken: string): Promise<string | undefined> => {
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

/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
const generateRandomString = (length: number): string => {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    return text;
};
