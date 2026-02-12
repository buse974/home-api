import { Dashboard, Widget, GenericDevice, DashboardWidget, DashboardWidgetDevice, Provider } from '../models/index.js';
import sequelize from '../config/database.js';
import ProviderFactory from '../providers/ProviderFactory.js';

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

// DELETE /dashboard-widgets/:id - Supprimer un widget et nettoyer les devices orphelins
export const deleteWidget = async (req, res) => {
  try {
    const dashboardWidget = await DashboardWidget.findOne({
      where: { id: req.params.id },
      include: [
        {
          model: Dashboard,
          as: 'Dashboard',
          where: { houseId: req.user.house_id }
        },
        {
          model: GenericDevice,
          as: 'GenericDevices',
          through: { attributes: [] }
        }
      ]
    });

    if (!dashboardWidget) {
      return res.status(404).json({ error: 'Widget not found' });
    }

    // Récupérer les IDs des devices liés avant suppression
    const deviceIds = dashboardWidget.GenericDevices.map(d => d.id);

    // Supprimer le widget dans une transaction
    await sequelize.transaction(async (t) => {
      // Supprimer le DashboardWidget (les associations via DashboardWidgetDevice seront supprimées automatiquement)
      await dashboardWidget.destroy({ transaction: t });

      // Pour chaque device, vérifier s'il est orphelin
      for (const deviceId of deviceIds) {
        // Compter combien d'autres widgets utilisent encore ce device
        const usageCount = await DashboardWidgetDevice.count({
          where: { genericDeviceId: deviceId },
          transaction: t
        });

        // Si plus aucun widget ne l'utilise, le supprimer
        if (usageCount === 0) {
          await GenericDevice.destroy({
            where: { id: deviceId },
            transaction: t
          });
          console.log(`🗑️  GenericDevice ${deviceId} supprimé (orphelin)`);
        }
      }
    });

    res.json({ success: true, orphansDeleted: deviceIds.length });
  } catch (error) {
    console.error('Delete widget error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Helper pour déchiffrer config provider
function decryptConfig(provider) {
  return provider.configEncrypted;
}

// POST /dashboard-widgets/:id/execute - Exécuter une commande sur TOUS les devices du widget
export const executeWidgetCommand = async (req, res) => {
  try {
    const { capability, params = {} } = req.body;

    // Récupérer le widget avec tous ses devices
    const dashboardWidget = await DashboardWidget.findOne({
      where: { id: req.params.id },
      include: [
        {
          model: Dashboard,
          as: 'Dashboard',
          where: { houseId: req.user.house_id }
        },
        {
          model: GenericDevice,
          as: 'GenericDevices',
          through: { attributes: [] },
          include: [{
            model: Provider,
            as: 'Provider'
          }]
        }
      ]
    });

    if (!dashboardWidget) {
      return res.status(404).json({ error: 'Widget not found' });
    }

    const devices = dashboardWidget.GenericDevices;

    if (!devices || devices.length === 0) {
      return res.status(400).json({ error: 'No devices associated with this widget' });
    }

    // Exécuter la commande sur TOUS les devices en parallèle
    const results = await Promise.allSettled(
      devices.map(async (device) => {
        const config = decryptConfig(device.Provider);
        const providerInstance = ProviderFactory.create(device.Provider.type, config);
        const providerDeviceId = device.command_mapping.device_id;

        await providerInstance.executeCapability(providerDeviceId, capability, params);

        return { deviceId: device.id, deviceName: device.name, success: true };
      })
    );

    // Analyser les résultats
    const succeeded = results.filter(r => r.status === 'fulfilled').map(r => r.value);
    const failed = results.filter(r => r.status === 'rejected').map((r, i) => ({
      deviceId: devices[i].id,
      deviceName: devices[i].name,
      error: r.reason.message
    }));

    res.json({
      success: failed.length === 0,
      executed: succeeded.length,
      total: devices.length,
      succeeded,
      failed
    });
  } catch (error) {
    console.error('Execute widget command error:', error);
    res.status(500).json({ error: error.message });
  }
};

// GET /dashboard-widgets/:id/state - Récupérer l'état de TOUS les devices du widget
export const getWidgetState = async (req, res) => {
  try {
    // Récupérer le widget avec tous ses devices
    const dashboardWidget = await DashboardWidget.findOne({
      where: { id: req.params.id },
      include: [
        {
          model: Dashboard,
          as: 'Dashboard',
          where: { houseId: req.user.house_id }
        },
        {
          model: GenericDevice,
          as: 'GenericDevices',
          through: { attributes: [] },
          include: [{
            model: Provider,
            as: 'Provider'
          }]
        }
      ]
    });

    if (!dashboardWidget) {
      return res.status(404).json({ error: 'Widget not found' });
    }

    const devices = dashboardWidget.GenericDevices;

    if (!devices || devices.length === 0) {
      return res.status(400).json({ error: 'No devices associated with this widget' });
    }

    // Récupérer l'état de TOUS les devices en parallèle
    const states = await Promise.allSettled(
      devices.map(async (device) => {
        const config = decryptConfig(device.Provider);
        const providerInstance = ProviderFactory.create(device.Provider.type, config);
        const providerDeviceId = device.command_mapping.device_id;

        const state = await providerInstance.getDeviceState(providerDeviceId);

        return {
          deviceId: device.id,
          deviceName: device.name,
          state
        };
      })
    );

    // Analyser les résultats
    const succeeded = states.filter(r => r.status === 'fulfilled').map(r => r.value);
    const failed = states.filter(r => r.status === 'rejected').map((r, i) => ({
      deviceId: devices[i].id,
      deviceName: devices[i].name,
      error: r.reason.message
    }));

    res.json({
      devices: succeeded,
      errors: failed,
      total: devices.length
    });
  } catch (error) {
    console.error('Get widget state error:', error);
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

// GET /dashboard-widgets/all - Liste de TOUS les DashboardWidgets de la maison (pour admin)
export const getAllDashboardWidgets = async (req, res) => {
  try {
    const dashboardWidgets = await DashboardWidget.findAll({
      include: [
        {
          model: Dashboard,
          as: 'Dashboard',
          where: { houseId: req.user.house_id },
          attributes: ['id', 'name']
        },
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
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({ dashboardWidgets });
  } catch (error) {
    console.error('Get all dashboard widgets error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const updateDashboardLayouts = async (req, res) => {
  try {
    const { layouts } = req.body;
    const { id } = req.params;

    const dashboard = await Dashboard.findOne({
      where: {
        id,
        houseId: req.user.house_id
      }
    });

    if (!dashboard) {
      return res.status(404).json({ error: 'Dashboard not found' });
    }

    await dashboard.update({ layouts });

    res.json({ success: true, layouts: dashboard.layouts });
  } catch (error) {
    console.error('Update dashboard layouts error:', error);
    res.status(500).json({ error: error.message });
  }
};
