/**
 * Classe abstraite de base pour tous les providers
 * Chaque provider doit implémenter ces méthodes
 */
class BaseProvider {
  constructor(config) {
    if (new.target === BaseProvider) {
      throw new Error("Cannot instantiate abstract class BaseProvider");
    }
    this.config = config;
  }

  /**
   * Tester la connexion au provider
   * @returns {Promise<boolean>}
   */
  async connect() {
    throw new Error("Method 'connect()' must be implemented");
  }

  /**
   * Lister tous les devices disponibles (format unifié)
   * @returns {Promise<Array<GenericDevice>>}
   */
  async listDevices() {
    throw new Error("Method 'listDevices()' must be implemented");
  }

  /**
   * Récupérer l'état d'un device
   * @param {string} deviceId
   * @returns {Promise<Object>} État unifié {isOn, brightness, temperature, color}
   */
  async getDeviceState(deviceId) {
    throw new Error("Method 'getDeviceState()' must be implemented");
  }

  /**
   * Exécuter une capability sur un device
   * @param {string} deviceId - ID du device dans le provider
   * @param {string} capability - "toggle", "dim", "color", "temperature"
   * @param {Object} params - {value: 50} pour dim, {r,g,b} pour color
   * @returns {Promise<void>}
   */
  async executeCapability(deviceId, capability, params = {}) {
    throw new Error("Method 'executeCapability()' must be implemented");
  }

  /**
   * S'abonner aux changements en temps réel
   * @param {Function} callback - Appelé quand un device change
   * @returns {Promise<void>}
   */
  async subscribe(callback) {
    throw new Error("Method 'subscribe()' must be implemented");
  }

  /**
   * Se désabonner
   * @returns {Promise<void>}
   */
  async unsubscribe() {
    // Optionnel, implémentation par défaut vide
  }
}

export default BaseProvider;
