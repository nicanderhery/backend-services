import { Router } from 'express';

const router = Router({ mergeParams: true });

router.get('/', (_req, res) => {
    res.send('Hello, World! from template');
});

export default router;
