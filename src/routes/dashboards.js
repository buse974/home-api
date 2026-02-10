import express from 'express';
import { getDashboards, createDashboard, getDashboardItems, addDashboardItem } from '../controllers/dashboards.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getDashboards);
router.post('/', createDashboard);
router.get('/:dashboardId/items', getDashboardItems);
router.post('/:dashboardId/items', addDashboardItem);

export default router;
