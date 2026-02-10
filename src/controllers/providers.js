import Provider from '../models/Provider.js';
import JeedomProvider from '../providers/JeedomProvider.js';

export const getProviders = async (req, res) => {
  try {
    const providers = await Provider.findAll({
      where: { userId: req.user.id },
      attributes: { exclude: ['configEncrypted'] }
    });

    res.json({ providers });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createProvider = async (req, res) => {
  try {
    const { type, name, config } = req.body;

    // Vérifier la connexion au provider
    let providerInstance;
    if (type === 'jeedom') {
      providerInstance = new JeedomProvider(config);
    } else {
      return res.status(400).json({ error: 'Unsupported provider type' });
    }

    const isConnected = await providerInstance.connect();
    if (!isConnected) {
      return res.status(400).json({ error: 'Failed to connect to provider' });
    }

    const provider = await Provider.create({
      userId: req.user.id,
      type,
      name,
      configEncrypted: config
    });

    res.status(201).json({ provider });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteProvider = async (req, res) => {
  try {
    const { id } = req.params;

    const provider = await Provider.findOne({
      where: { id, userId: req.user.id }
    });

    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }

    await provider.destroy();
    res.json({ message: 'Provider deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
