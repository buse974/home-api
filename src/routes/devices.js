import express from 'express';
import { getDevices, executeCommand } from '../controllers/devices.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/:providerId', getDevices);
router.post('/:providerId/:deviceId/command', executeCommand);

export default router;
