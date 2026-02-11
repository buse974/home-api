import { Dashboard, Widget, GenericDevice, DashboardWidget, DashboardWidgetDevice, Provider } from '../models/index.js';
import sequelize from '../config/database.js';

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
            as: 'GenericDevices',
            attributes: ['id', 'name', 'type', 'capabilities'],
            through: { attributes: [] }
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
    const { widgetId, genericDeviceIds, config = {}, position = { x: 0, y: 0, w: 2, h: 1 } } = req.body;

    // Valider que genericDeviceIds est un array non vide
    if (!Array.isArray(genericDeviceIds) || genericDeviceIds.length === 0) {
      return res.status(400).json({ error: 'genericDeviceIds must be a non-empty array' });
    }

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

    // Vérifier que TOUS les devices appartiennent à la maison
    const devices = await GenericDevice.findAll({
      where: { id: genericDeviceIds },
      include: [{
        model: Provider,
        as: 'Provider',
        where: { houseId: req.user.house_id }
      }]
    });

    if (devices.length !== genericDeviceIds.length) {
      return res.status(404).json({ error: 'One or more devices not found or do not belong to this house' });
    }

    // Créer le DashboardWidget et ses associations dans une transaction atomique
    const result = await sequelize.transaction(async (t) => {
      // Créer le DashboardWidget SANS genericDeviceId
      const dashboardWidget = await DashboardWidget.create({
        dashboardId: req.params.dashboardId,
        widgetId,
        config,
        position
      }, { transaction: t });

      // Créer les associations via DashboardWidgetDevice
      const associations = genericDeviceIds.map(deviceId => ({
        dashboardWidgetId: dashboardWidget.id,
        genericDeviceId: deviceId
      }));
      await DashboardWidgetDevice.bulkCreate(associations, { transaction: t });

      // Recharger avec les associations pour la réponse
      return await DashboardWidget.findByPk(dashboardWidget.id, {
        include: [
          { model: Widget, as: 'Widget' },
          {
            model: GenericDevice,
            as: 'GenericDevices',
            through: { attributes: [] }
          }
        ],
        transaction: t
      });
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
    const { config, position, genericDeviceIds } = req.body;

    const dashboardWidget = await DashboardWidget.findOne({
      where: { id: req.params.id },
      include: [{
        model: Dashboard,
        as: 'Dashboard',
        where: { houseId: req.user.house_id }
      }]
    });

    if (!dashboardWidget) {
      return res.status(404).json({ error: 'Widget not found' });
    }

    // Valider genericDeviceIds si fourni (avant transaction)
    if (genericDeviceIds !== undefined) {
      if (!Array.isArray(genericDeviceIds) || genericDeviceIds.length === 0) {
        return res.status(400).json({ error: 'genericDeviceIds must be a non-empty array' });
      }

      // Vérifier que TOUS les devices appartiennent à la maison
      const devices = await GenericDevice.findAll({
        where: { id: genericDeviceIds },
        include: [{
          model: Provider,
          as: 'Provider',
          where: { houseId: req.user.house_id }
        }]
      });

      if (devices.length !== genericDeviceIds.length) {
        return res.status(404).json({ error: 'One or more devices not found or do not belong to this house' });
      }
    }

    // Mettre à jour dans une transaction atomique
    const result = await sequelize.transaction(async (t) => {
      // Mettre à jour config et position
      if (config !== undefined) {
        dashboardWidget.config = config;
      }

      if (position !== undefined) {
        dashboardWidget.position = position;
      }

      await dashboardWidget.save({ transaction: t });

      // Si genericDeviceIds est fourni, mettre à jour les associations
      if (genericDeviceIds !== undefined) {
        // Supprimer les anciennes associations
        await DashboardWidgetDevice.destroy({
          where: { dashboardWidgetId: dashboardWidget.id },
          transaction: t
        });

        // Créer les nouvelles associations
        const associations = genericDeviceIds.map(deviceId => ({
          dashboardWidgetId: dashboardWidget.id,
          genericDeviceId: deviceId
        }));
        await DashboardWidgetDevice.bulkCreate(associations, { transaction: t });
      }

      // Recharger avec les associations pour la réponse
      return await DashboardWidget.findByPk(dashboardWidget.id, {
        include: [
          { model: Widget, as: 'Widget' },
          {
            model: GenericDevice,
            as: 'GenericDevices',
            through: { attributes: [] }
          }
        ],
        transaction: t
      });
    });

    res.json({ dashboardWidget: result });
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
        as: 'Dashboard',
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
