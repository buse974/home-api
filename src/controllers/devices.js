import { Provider, GenericDevice } from '../models/index.js';
import ProviderFactory from '../providers/ProviderFactory.js';

// Helper pour déchiffrer config provider
function decryptConfig(provider) {
  // Le getter du modèle Provider déchiffre automatiquement
  return provider.configEncrypted;
}

// GET /devices/available/:providerId - Liste LIVE des devices du provider
export const getAvailableDevices = async (req, res) => {
  try {
    const provider = await Provider.findOne({
      where: {
        id: req.params.providerId,
        houseId: req.user.house_id
      }
    });

    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }

    const config = decryptConfig(provider);
    const providerInstance = ProviderFactory.create(provider.type, config);

    const devices = await providerInstance.listDevices();

    res.json({ devices });
  } catch (error) {
    console.error('List available devices error:', error);
    res.status(500).json({ error: error.message });
  }
};

// POST /devices - Créer un generic_device (lazy creation)
// Utilise findOrCreate pour éviter les doublons si le même device physique est ajouté plusieurs fois
export const createDevice = async (req, res) => {
  try {
    const { provider_id, name, type, capabilities, command_mapping } = req.body;

    // Vérifier que provider appartient à la maison
    const provider = await Provider.findOne({
      where: {
        id: provider_id,
        houseId: req.user.house_id
      }
    });

    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }

    // findOrCreate pour éviter la duplication si le même device physique est ajouté plusieurs fois
    // La clé unique est (provider_id, command_mapping.device_id)
    const [device, created] = await GenericDevice.findOrCreate({
      where: {
        provider_id,
        command_mapping: command_mapping // Sequelize compare les JSON en profondeur
      },
      defaults: {
        name,
        type,
        capabilities,
        command_mapping
      }
    });

    res.json({ device, created }); // Retourne aussi 'created' (true si nouveau, false si existant)
  } catch (error) {
    console.error('Create device error:', error);
    res.status(500).json({ error: error.message });
  }
};

// GET /devices - Liste des generic_devices de la maison
export const getDevices = async (req, res) => {
  try {
    const devices = await GenericDevice.findAll({
      include: [{
        model: Provider,
        as: 'Provider',
        where: { houseId: req.user.house_id },
        attributes: ['id', 'name', 'type']
      }]
    });

    res.json({ devices });
  } catch (error) {
    console.error('List devices error:', error);
    res.status(500).json({ error: error.message });
  }
};

// POST /devices/:id/execute - Exécuter une capability
export const executeCapability = async (req, res) => {
  try {
    const { capability, params = {} } = req.body;

    const device = await GenericDevice.findOne({
      where: { id: req.params.id },
      include: [{
        model: Provider,
        as: 'Provider',
        where: { houseId: req.user.house_id }
      }]
    });

    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    const config = decryptConfig(device.Provider);
    const providerInstance = ProviderFactory.create(device.Provider.type, config);

    const providerDeviceId = device.command_mapping.device_id;

    await providerInstance.executeCapability(providerDeviceId, capability, params);

    res.json({ success: true });
  } catch (error) {
    console.error('Execute capability error:', error);
    res.status(500).json({ error: error.message });
  }
};

// GET /devices/:id/state - État actuel du device
export const getDeviceState = async (req, res) => {
  try {
    const device = await GenericDevice.findOne({
      where: { id: req.params.id },
      include: [{
        model: Provider,
        as: 'Provider',
        where: { houseId: req.user.house_id }
      }]
    });

    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    const config = decryptConfig(device.Provider);
    const providerInstance = ProviderFactory.create(device.Provider.type, config);

    const providerDeviceId = device.command_mapping.device_id;
    const state = await providerInstance.getDeviceState(providerDeviceId);

    res.json({ state });
  } catch (error) {
    console.error('Get state error:', error);
    res.status(500).json({ error: error.message });
  }
};

// DELETE /devices/:id
export const deleteDevice = async (req, res) => {
  try {
    const device = await GenericDevice.findOne({
      where: { id: req.params.id },
      include: [{
        model: Provider,
        as: 'Provider',
        where: { houseId: req.user.house_id }
      }]
    });

    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    await device.destroy();
    res.json({ success: true });
  } catch (error) {
    console.error('Delete device error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Alias pour compatibilité avec anciennes routes
export const executeCommand = executeCapability;
