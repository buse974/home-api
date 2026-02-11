import { Provider } from '../models/index.js';
import ProviderFactory from '../providers/ProviderFactory.js';

// GET /providers - Liste des providers de la maison
export const getProviders = async (req, res) => {
  try {
    const providers = await Provider.findAll({
      where: { houseId: req.user.house_id },
      attributes: { exclude: ['configEncrypted'] }
    });

    res.json({ providers });
  } catch (error) {
    console.error('List providers error:', error);
    res.status(500).json({ error: error.message });
  }
};

// POST /providers - Créer un provider (pour le futur, MVP utilise seed)
export const createProvider = async (req, res) => {
  try {
    const { type, name, config } = req.body;

    // Vérifier la connexion au provider
    const providerInstance = ProviderFactory.create(type, config);
    const isConnected = await providerInstance.connect();

    if (!isConnected) {
      return res.status(400).json({ error: 'Failed to connect to provider' });
    }

    const provider = await Provider.create({
      houseId: req.user.house_id,
      type,
      name,
      configEncrypted: config
    });

    res.status(201).json({ provider });
  } catch (error) {
    console.error('Create provider error:', error);
    res.status(500).json({ error: error.message });
  }
};

// DELETE /providers/:id - Supprimer un provider (pour le futur)
export const deleteProvider = async (req, res) => {
  try {
    const provider = await Provider.findOne({
      where: {
        id: req.params.id,
        houseId: req.user.house_id
      }
    });

    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }

    await provider.destroy();
    res.json({ success: true });
  } catch (error) {
    console.error('Delete provider error:', error);
    res.status(500).json({ error: error.message });
  }
};
