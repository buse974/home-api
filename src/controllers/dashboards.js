import Dashboard from '../models/Dashboard.js';
import DashboardItem from '../models/DashboardItem.js';

export const getDashboards = async (req, res) => {
  try {
    const dashboards = await Dashboard.findAll({
      where: { userId: req.user.id }
    });

    res.json({ dashboards });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createDashboard = async (req, res) => {
  try {
    const { name, configJson, isDefault } = req.body;

    const dashboard = await Dashboard.create({
      userId: req.user.id,
      name,
      configJson: configJson || {},
      isDefault: isDefault || false
    });

    res.status(201).json({ dashboard });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getDashboardItems = async (req, res) => {
  try {
    const { dashboardId } = req.params;

    const items = await DashboardItem.findAll({
      where: { dashboardId }
    });

    res.json({ items });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const addDashboardItem = async (req, res) => {
  try {
    const { dashboardId } = req.params;
    const { providerId, providerDeviceId, type, configJson } = req.body;

    const item = await DashboardItem.create({
      dashboardId,
      providerId,
      providerDeviceId,
      type,
      configJson: configJson || {}
    });

    res.status(201).json({ item });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
