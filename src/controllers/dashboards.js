import { Dashboard, Widget, GenericDevice, DashboardWidget, Provider } from '../models/index.js';

// GET /dashboards - Liste des dashboards de la maison
export const getDashboards = async (req, res) => {
  try {
    const dashboards = await Dashboard.findAll({
      where: { houseId: req.user.house_id }
    });

    res.json({ dashboards });
  } catch (error) {
    console.error('List dashboards error:', error);
    res.status(500).json({ error: error.message });
  }
};

// GET /dashboards/:id - Un dashboard avec ses widgets
export const getDashboard = async (req, res) => {
  try {
    const dashboard = await Dashboard.findOne({
      where: {
        id: req.params.id,
        houseId: req.user.house_id
      },
      include: [{
        model: DashboardWidget,
        as: 'DashboardWidgets',
        include: [
          {
            model: Widget,
            as: 'Widget',
            attributes: ['id', 'name', 'libelle', 'component', 'icon']
          },
          {
            model: GenericDevice,
            as: 'GenericDevice',
            attributes: ['id', 'name', 'type', 'capabilities']
          }
        ]
      }]
    });

    if (!dashboard) {
      return res.status(404).json({ error: 'Dashboard not found' });
    }

    res.json({ dashboard });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({ error: error.message });
  }
};

// POST /dashboards - Créer un dashboard
export const createDashboard = async (req, res) => {
  try {
    const { name, isDefault = false } = req.body;

    const dashboard = await Dashboard.create({
      houseId: req.user.house_id,
      name,
      isDefault
    });

    res.status(201).json({ dashboard });
  } catch (error) {
    console.error('Create dashboard error:', error);
    res.status(500).json({ error: error.message });
  }
};

// POST /dashboards/:dashboardId/widgets - Ajouter un widget au dashboard
export const addWidget = async (req, res) => {
  try {
    const { widgetId, genericDeviceId, config = {}, position = { x: 0, y: 0, w: 2, h: 1 } } = req.body;

    // Vérifier que le dashboard appartient à la maison
    const dashboard = await Dashboard.findOne({
      where: {
        id: req.params.dashboardId,
        houseId: req.user.house_id
      }
    });

    if (!dashboard) {
      return res.status(404).json({ error: 'Dashboard not found' });
    }

    // Vérifier que le widget existe
    const widget = await Widget.findByPk(widgetId);
    if (!widget) {
      return res.status(404).json({ error: 'Widget not found' });
    }

    // Vérifier que le generic_device appartient à la maison
    const device = await GenericDevice.findOne({
      where: { id: genericDeviceId },
      include: [{
        model: Provider,
        where: { houseId: req.user.house_id }
      }]
    });

    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    const dashboardWidget = await DashboardWidget.create({
      dashboardId: req.params.dashboardId,
      widgetId,
      genericDeviceId,
      config,
      position
    });

    // Recharger avec les associations pour la réponse
    const result = await DashboardWidget.findByPk(dashboardWidget.id, {
      include: [
        { model: Widget },
        { model: GenericDevice }
      ]
    });

    res.status(201).json({ dashboardWidget: result });
  } catch (error) {
    console.error('Add widget error:', error);
    res.status(500).json({ error: error.message });
  }
};

// PUT /dashboard-widgets/:id - Mettre à jour un widget
export const updateWidget = async (req, res) => {
  try {
    const { config, position } = req.body;

    const dashboardWidget = await DashboardWidget.findOne({
      where: { id: req.params.id },
      include: [{
        model: Dashboard,
        where: { houseId: req.user.house_id }
      }]
    });

    if (!dashboardWidget) {
      return res.status(404).json({ error: 'Widget not found' });
    }

    if (config !== undefined) {
      dashboardWidget.config = config;
    }

    if (position !== undefined) {
      dashboardWidget.position = position;
    }

    await dashboardWidget.save();

    res.json({ dashboardWidget });
  } catch (error) {
    console.error('Update widget error:', error);
    res.status(500).json({ error: error.message });
  }
};

// DELETE /dashboard-widgets/:id - Supprimer un widget
export const deleteWidget = async (req, res) => {
  try {
    const dashboardWidget = await DashboardWidget.findOne({
      where: { id: req.params.id },
      include: [{
        model: Dashboard,
        where: { houseId: req.user.house_id }
      }]
    });

    if (!dashboardWidget) {
      return res.status(404).json({ error: 'Widget not found' });
    }

    await dashboardWidget.destroy();
    res.json({ success: true });
  } catch (error) {
    console.error('Delete widget error:', error);
    res.status(500).json({ error: error.message });
  }
};

// GET /widgets - Catalogue de widgets disponibles
export const getWidgets = async (req, res) => {
  try {
    const widgets = await Widget.findAll({
      attributes: ['id', 'name', 'libelle', 'component', 'description', 'icon', 'config_schema']
    });

    res.json({ widgets });
  } catch (error) {
    console.error('List widgets error:', error);
    res.status(500).json({ error: error.message });
  }
};
