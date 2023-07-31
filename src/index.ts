import dotenv from 'dotenv';
import express from 'express';
import fs from 'fs';

dotenv.config();

const app = express();
const PORT = 9999;
const baseUrl = process.env.BASE_URL || `http://localhost:${PORT}`;
const apiRoute = process.env.API_ROUTE || '/api';
export const SM = new Map<string, string>();
SM.set('baseUrl', baseUrl);
SM.set('apiRoute', apiRoute);

// Get all folder's names in the src folder
const folders = fs.readdirSync(__dirname + '/');
// Filter . and from the array
const filteredFolders = folders.filter((folder: string) => !folder.includes('.'));

// Loop through the folders and import the routes
filteredFolders.forEach(async (folder: string) => {
    try {
        const route = await import(`./${folder}/controller.js`);
        app.use(`${apiRoute}/${folder}`, route.default);
        console.log(`Loaded ${folder} route`);
    } catch (error) {
        console.log(`Error loading ${folder} route`);
    }

    // At the last iteration, create 404 route
    if (filteredFolders.indexOf(folder) === filteredFolders.length - 1) {
        app.get('*', (_req, res) => {
            res.status(404).send({ message: '404 Not Found' });
        });
    }
});

app.get('/', (_req, res) => {
    // Send a list of all the routes and whether they are available or not in HTML format
    res.status(200).send(
        `<h1>Available routes:</h1><ul>${filteredFolders
            .map((folder: string) => {
                const color = inRouter(folder) ? 'green' : 'red';
                return `<li><span style="color: ${color}; font-size: 3rem;">■ </span>
                <a href="${apiRoute}/${folder}" style="font-size: 3rem;">${apiRoute}/${folder}</a></li>`;
            })
            .join('')}</ul>`,
    );
});

app.get(apiRoute, (_req, res) => {
    // Send a list of all the routes and whether they are available or not in JSON format
    res.status(200).send(
        filteredFolders.map((folder: string) => {
            return {
                route: `${apiRoute}/${folder}`,
                status: inRouter(folder) ? 'available' : 'not available',
            };
        }),
    );
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

/**
 * Check if a route is available in the router
 * @param route The route to check
 * @returns true if the route is available, false if not
 */
const inRouter = (route: string) => {
    return app._router.stack.some((layer: { regexp: RegExp }) =>
        layer.regexp.toString().startsWith(`/^\\${apiRoute}\\/${route}\\/?(?=\\/|$)/i`),
    );
};
