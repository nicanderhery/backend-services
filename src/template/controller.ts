import { Router } from 'express';

const router = Router({ mergeParams: true });

// Redirect to the latest version
router.get('/', (_req, res) => {
    res.redirect(_req.baseUrl + '/v1');
});

router.get('/v1', (_req, res) => {
    res.status(200).send({ message: 'API v1' });
});

export default router;
