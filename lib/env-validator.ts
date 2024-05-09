type EnvVariable = {
  SERVER_ADDRESS: string;
  RMV_ACCESS_ID: string;
  SPOTIFY_CLIENT_ID: string;
  SPOTIFY_CLIENT_SECRET: string;
  //! Add more environment variables here
};

/**
 * Retrieves and validates the required environment variables.
 * @returns {EnvVariable} The validated environment variables.
 * @throws {Error} If any of the required environment variables are missing.
 */
export const loadEnv = () => {
  const env: EnvVariable = {
    SERVER_ADDRESS: process.env.SERVER_ADDRESS || '',
    RMV_ACCESS_ID: process.env.RMV_ACCESS_ID || '',
    SPOTIFY_CLIENT_ID: process.env.SPOTIFY_CLIENT_ID || '',
    SPOTIFY_CLIENT_SECRET: process.env.SPOTIFY_CLIENT_SECRET || '',
    //! Add more environment variables here
  };

  // If any of the environment variables are missing, throw an error
  const errorMessages: string[] = [];
  Object.entries(env).forEach(([key, value]) => {
    if (!value) {
      errorMessages.push(`Environment variable ${key} is missing`);
    }
  });

  if (errorMessages.length > 0) {
    throw new Error(errorMessages.join('\n'));
  }

  return env;
};
