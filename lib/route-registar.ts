import fs from 'fs';
import path from 'path';

/**
 * Recursively registers API routes from the specified start folder.
 * @param startFolder - The start folder to search for API routes. Defaults to 'app/api' in the current working directory.
 */
const registerRecursiveApiRoutes = (startFolder = path.join(process.cwd(), 'app/api')) => {
  fs.readdirSync(startFolder, { withFileTypes: true }).forEach((dirent) => {
    if (dirent.isDirectory()) {
      const folder = path.join(startFolder, dirent.name);
      registerRecursiveApiRoutes(folder);
    } else if (dirent.name === 'route.ts') {
      const route = path
        .join(startFolder, dirent.name)
        .replace(process.cwd(), '')
        .replaceAll('\\', '/')
        .replace('/route.ts', '')
        .replaceAll('/app/', '/');
      registerRoute(route);
    }
  });
};

/**
 * Registers the API routes. This function should be called in the root route file. will only register the routes once.
 */
const registerApiRoutes = (): void => {
  if (registeredRoutes.length > 0) {
    return;
  }

  registerRecursiveApiRoutes();
  registeredRoutes.sort();
};

const registeredRoutes: string[] = [];

/**
 * Registers a route.
 * @param route - The route to be registered.
 */
export const registerRoute = (route: string): void => {
  registeredRoutes.push(route);
};

export const getRegisteredRoutes = (): string[] => {
  if (registeredRoutes.length === 0) {
    registerApiRoutes();
  }

  return registeredRoutes;
};

/**
 * Retrieves the current route based on the directory name.
 * @returns {string | undefined} The current route, or undefined if not found.
 */
export const getCurrentRoute = () => {
  const dirName = path.basename(__dirname);
  const routes = getRegisteredRoutes();
  const route = routes.find((registeredRoute) => registeredRoute.endsWith(dirName));
  return route;
};
