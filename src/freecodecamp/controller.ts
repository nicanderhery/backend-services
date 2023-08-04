import { Router } from 'express';
import multer from 'multer';
import { SM } from '..';
import {
    addExercise,
    addUser,
    getLogs,
    getUser,
    getUsers,
} from './exercise-tracker/exercise-tracker';
import { Log } from './exercise-tracker/interfaces/log';
import { getMetadata } from './file-metadata/file-metadata';
import { getUTCDate, getUnixDate, isUnixDate, isValidDate } from './timestamp/timestamp';
import { addShortcut, getOriginalUrl } from './url-shortener/url-shortener';
import { getUserInfo } from './whoami/whoami';

const apiRoute = SM.get('apiRoute');
if (!apiRoute) {
    throw new Error('No api route found');
}

const upload = multer({ dest: 'dist/freecodecamp/file-metadata/uploads' });

const router = Router({ mergeParams: true });

// Redirect to the latest version
router.get('/', (req, res) => {
    res.redirect(req.baseUrl + '/v1');
});

router.get('/v1', (_req, res) => {
    res.status(200).send({ message: 'API v1' });
});

router.get(`/v1/timestamp/${apiRoute}/:date?`, (req, res) => {
    const date = req.params.date;
    if (!date) {
        const unix = getUnixDate(new Date().toUTCString());
        const utc = getUTCDate(new Date().toUTCString());
        return res.status(200).send({ unix: unix, utc: utc });
    }

    const isUnix = isUnixDate(date);
    const isUtc = isValidDate(date);

    if (!isUnix && !isUtc) {
        return res.status(400).send({ error: 'Invalid Date' });
    }

    const unix = isUnix ? Number(date) : getUnixDate(date);
    const utc = isUtc ? getUTCDate(date) : getUTCDate(unix);
    res.status(200).send({ unix: unix, utc: utc });
});

router.get(`/v1/request-parser/${apiRoute}/whoami`, (req, res) => {
    return res.status(200).send(getUserInfo(req));
});

router.get(`/v1/url-shortener/${apiRoute}/shorturl/:url`, (req, res) => {
    const url = req.params.url;
    if (!url) {
        return res.status(400).send({ error: 'Invalid URL' });
    }

    const shortcut = getOriginalUrl(url);
    if (!shortcut) {
        return res.status(200).send({ error: 'Shortcut for this hashed URL not found' });
    }

    res.redirect(shortcut);
});

router.post(`/v1/url-shortener/${apiRoute}/shorturl`, async (req, res) => {
    const url = req.body.url;
    if (!url) {
        return res.status(200).send({ error: 'Invalid URL' });
    }

    const short_url = await addShortcut(url);
    if (!short_url) {
        return res.status(200).send({ error: 'Invalid URL' });
    }

    res.status(200).send(short_url);
});

router.get(`/v1/exercise-tracker/${apiRoute}/users`, (_req, res) => {
    res.status(200).send(getUsers());
});

router.post(`/v1/exercise-tracker/${apiRoute}/users`, (req, res) => {
    const username = req.body.username;
    if (!username) {
        return res.status(400).send({ error: 'Username is required' });
    }

    res.status(200).send(addUser(username));
});

router.post(`/v1/exercise-tracker/${apiRoute}/users/:_id/exercises`, (req, res) => {
    const userId = req.params._id;
    const user = getUser(userId);
    if (!user) {
        return res.status(404).send({ error: 'User not found' });
    }

    const description = req.body.description;
    const duration = req.body.duration;
    const date = req.body.date;
    if (!description || !duration) {
        return res.status(400).send({ error: 'Description and duration are required' });
    }

    const exercise = addExercise(userId, description, duration, date);
    if (!exercise) {
        return res.status(500).send({ error: 'Error adding exercise' });
    }

    const userWithExercise = {
        _id: user._id,
        username: user.username,
        description: exercise.description,
        duration: Number(exercise.duration),
        date: exercise.date,
    };

    console.log(userWithExercise);

    res.status(200).send(userWithExercise);
});

router.get(`/v1/exercise-tracker/${apiRoute}/users/:_id/logs`, (req, res) => {
    const userId = req.params._id;
    const user = getUser(userId);
    if (!user) {
        return res.status(404).send({ error: 'User not found' });
    }

    // Create a deep copy of the logs
    const logs: Log = JSON.parse(JSON.stringify(getLogs(userId)));
    if (!logs) {
        return res.status(500).send({ error: 'Error getting logs' });
    }

    const from = req.query.from as string | undefined;
    const to = req.query.to as string | undefined;
    const limit = req.query.limit as string | undefined;

    if (from) {
        const fromDate = new Date(from);
        if (isNaN(fromDate.getTime())) {
            return res.status(400).send({ error: 'Invalid from date' });
        }

        logs.logs = logs.logs.filter((log) => {
            const logDate = new Date(log.date);
            return logDate >= fromDate;
        });
    }

    if (to) {
        const toDate = new Date(to);
        if (isNaN(toDate.getTime())) {
            return res.status(400).send({ error: 'Invalid to date' });
        }

        logs.logs = logs.logs.filter((log) => {
            const logDate = new Date(log.date);
            return logDate <= toDate;
        });
    }

    if (limit) {
        const limitNumber = Number(limit);
        if (isNaN(limitNumber)) {
            return res.status(400).send({ error: 'Invalid limit' });
        }

        logs.logs = logs.logs.slice(0, limitNumber);
    }

    res.status(200).send({
        _id: user._id,
        username: user.username,
        count: logs.count,
        log: logs.logs,
    });
});

router.get('/v1/file-metadata', (_req, res) => {
    // Create a simple form to upload a file
    res.status(200).send(`
        <form action="/api/v1/file-metadata/${apiRoute}/fileanalyse" method="post" enctype="multipart/form-data">
            <input type="file" name="upfile" />
            <input type="submit" value="Upload" />
        </form>
    `);
});

router.post(`/v1/file-metadata/${apiRoute}/fileanalyse`, upload.single('upfile'), (req, res) => {
    const file = req.file;
    console.log(file);

    if (!file) {
        console.log('File is required');

        return res.status(400).send({ error: 'File is required' });
    }

    res.status(200).send(getMetadata(file));
});

export default router;
