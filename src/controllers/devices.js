import Provider from '../models/Provider.js';
import JeedomProvider from '../providers/JeedomProvider.js';

export const getDevices = async (req, res) => {
  try {
    const { providerId } = req.params;

    const provider = await Provider.findOne({
      where: { id: providerId, userId: req.user.id }
    });

    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }

    let providerInstance;
    if (provider.type === 'jeedom') {
      providerInstance = new JeedomProvider(provider.configEncrypted);
    } else {
      return res.status(400).json({ error: 'Unsupported provider type' });
    }

    const devices = await providerInstance.getDevices();
    res.json({ devices });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const executeCommand = async (req, res) => {
  try {
    const { providerId, deviceId } = req.params;
    const { command, params } = req.body;

    const provider = await Provider.findOne({
      where: { id: providerId, userId: req.user.id }
    });

    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }

    let providerInstance;
    if (provider.type === 'jeedom') {
      providerInstance = new JeedomProvider(provider.configEncrypted);
    } else {
      return res.status(400).json({ error: 'Unsupported provider type' });
    }

    const result = await providerInstance.executeCommand(deviceId, command, params);
    res.json({ result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
