import fs from 'fs';

let refreshToken = '';
let tryLoadToken = false;

/**
 * Loads the refresh token from the 'token.txt' file.
 * @returns The refresh token.
 */
const loadRefreshToken = () => {
  if (tryLoadToken) {
    return;
  }

  try {
    refreshToken = fs.readFileSync('./refresh_token', 'utf8');
  } catch (error) {
    // Do nothing if the file does not exist
  } finally {
    tryLoadToken = true;
  }
};

/**
 * Retrieves the refresh token.
 * If the token is not already loaded, it will be loaded before returning.
 * @returns The refresh token.
 */
export const getRefreshToken = () => {
  if (!tryLoadToken) {
    loadRefreshToken();
  }

  return refreshToken;
};

/**
 * Sets the refresh token and writes it to a file.
 * @param token - The refresh token to set.
 */
export const setRefreshToken = (token: string) => {
  refreshToken = token;
  fs.writeFileSync('./refresh_token', token, 'utf8');
};
