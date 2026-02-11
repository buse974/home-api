import express from 'express';
import {
  getDashboards,
  getDashboard,
  createDashboard,
  addWidget,
  updateWidget,
  deleteWidget,
  getWidgets
} from '../controllers/dashboards.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

// Catalogue de widgets (AVANT les routes avec params)
router.get('/widgets/catalogue', getWidgets);

// Dashboards
router.get('/', getDashboards);
router.post('/', createDashboard);
router.get('/:id', getDashboard);

// Widgets sur dashboard
router.post('/:dashboardId/widgets', addWidget);

// Gestion des widgets (update/delete)
router.put('/widgets/:id', updateWidget);
router.delete('/widgets/:id', deleteWidget);

export default router;
