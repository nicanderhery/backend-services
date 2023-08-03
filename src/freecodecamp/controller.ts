import { Router } from 'express';
import { getUTCDate, getUnixDate, isUnixDate, isValidDate } from './timestamp/timestamp';

const router = Router({ mergeParams: true });

// Redirect to the latest version
router.get('/', (_req, res) => {
    res.redirect(_req.baseUrl + '/v1');
});

router.get('/v1', (_req, res) => {
    res.status(200).send({ message: 'API v1' });
});

router.get('/timestamp', (_req, res) => {
    const unix = getUnixDate(new Date().toUTCString());
    const utc = getUTCDate(new Date().toUTCString());
    res.status(200).send({ unix: unix, utc: utc });
});

router.get('/timestamp/:input', (_req, res) => {
    const input = _req.params.input;
    const isUnix = isUnixDate(input);
    const isUtc = isValidDate(input);

    if (!isUnix && !isUtc) {
        return res.status(200).send({ error: 'Invalid Date' });
    }

    const unix = isUnix ? Number(input) : getUnixDate(input);
    const utc = isUtc ? getUTCDate(input) : getUTCDate(unix);
    res.status(200).send({ unix: unix, utc: utc });
});

export default router;
