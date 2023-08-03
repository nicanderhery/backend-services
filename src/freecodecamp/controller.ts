import { Router } from 'express';
import { SM } from '..';
import { getUTCDate, getUnixDate, isUnixDate, isValidDate } from './timestamp/timestamp';

const apiRoute = SM.get('apiRoute');
if (!apiRoute) {
    throw new Error('No api route found');
}

const router = Router({ mergeParams: true });

// Redirect to the latest version
router.get('/', (_req, res) => {
    res.redirect(_req.baseUrl + '/v1');
});

router.get('/v1', (_req, res) => {
    res.status(200).send({ message: 'API v1' });
});

router.get(`/v1/timestamp/${apiRoute}/:date?`, (_req, res) => {
    const date = _req.params.date;
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

export default router;
