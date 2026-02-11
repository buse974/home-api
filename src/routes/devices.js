import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  getAvailableDevices,
  createDevice,
  getDevices,
  executeCapability,
  getDeviceState,
  deleteDevice
} from '../controllers/devices.js';

const router = express.Router();

router.use(authenticate);

// GET /devices/available/:providerId - Liste LIVE des devices du provider
router.get('/available/:providerId', getAvailableDevices);

// POST /devices - Créer un generic_device
router.post('/', createDevice);

// GET /devices - Liste des generic_devices de la maison
router.get('/', getDevices);

// POST /devices/:id/execute - Exécuter une capability
router.post('/:id/execute', executeCapability);

// GET /devices/:id/state - État actuel
router.get('/:id/state', getDeviceState);

// DELETE /devices/:id
router.delete('/:id', deleteDevice);

export default router;
