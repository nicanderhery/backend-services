import express from 'express';
import fs from 'fs';

const app = express();
const PORT = 3000;

// Browser names in the user-agent header
const browsers = ['Mozilla', 'Chrome', 'Safari', 'Opera', 'Firefox', 'Edge'];

// Get all folder's names in the src folder
const folders = fs.readdirSync(__dirname + '/');
// Filter . and from the array
const filteredFolders = folders.filter((folder: string) => !folder.includes('.'));

// Loop through the folders and import the routes
filteredFolders.forEach(async (folder: string) => {
    try {
        const route = await import(`./${folder}/controller.js`);
        app.use(`/${folder}`, route.default);
        console.log(`Loaded ${folder} route`);
    } catch (error) {
        console.log(`Error loading ${folder} route`);
    }
});

app.get('/', (req, res) => {
    // Check if the request is from a browser
    let isFromBrowser = false;
    browsers.forEach((browser: string) => {
        if (req.headers['user-agent']?.includes(browser)) {
            isFromBrowser = true;
        }
    });

    // Send a list of all the routes and whether they are available or not
    if (isFromBrowser) {
        // In HTML format
        return res.send(
            `<h1>Available routes:</h1><ul>${filteredFolders
                .map((folder: string) => {
                    const color = app._router.stack.some((layer: { regexp: RegExp }) =>
                        layer.regexp.toString().startsWith(`/^\\/${folder}\\/?(?=\\/|$)/i`),
                    )
                        ? 'green'
                        : 'red';
                    return `<li><span style="color: ${color}; font-size: 3rem;">■ </span>
                    <a href="/${folder}" style="font-size: 3rem;">/${folder}</a></li>`;
                })
                .join('')}</ul>`,
        );
    }

    return res.send(
        filteredFolders.map((folder: string) => {
            return {
                route: `/${folder}`,
                available: app._router.stack.some((layer: { regexp: RegExp }) =>
                    layer.regexp.toString().startsWith(`/^\\/${folder}\\/?(?=\\/|$)/i`),
                ),
            };
        }),
    );
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
