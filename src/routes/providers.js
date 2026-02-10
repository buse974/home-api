import express from 'express';
import { getProviders, createProvider, deleteProvider } from '../controllers/providers.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getProviders);
router.post('/', createProvider);
router.delete('/:id', deleteProvider);

export default router;
