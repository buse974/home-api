/**
 * Classe abstraite de base pour tous les providers
 * Chaque provider doit implémenter ces méthodes
 */
class BaseProvider {
  constructor(config) {
    this.config = config;
  }

  /**
   * Se connecter au provider
   * @returns {Promise<boolean>}
   */
  async connect() {
    throw new Error('connect() must be implemented');
  }

  /**
   * Récupérer tous les devices
   * @returns {Promise<Array>}
   */
  async getDevices() {
    throw new Error('getDevices() must be implemented');
  }

  /**
   * Exécuter une commande sur un device
   * @param {string} deviceId
   * @param {string} command
   * @param {object} params
   * @returns {Promise<any>}
   */
  async executeCommand(deviceId, command, params = {}) {
    throw new Error('executeCommand() must be implemented');
  }

  /**
   * S'abonner aux changements d'état (temps réel)
   * @param {function} callback
   * @returns {Promise<void>}
   */
  async subscribe(callback) {
    throw new Error('subscribe() must be implemented');
  }

  /**
   * Se déconnecter du provider
   * @returns {Promise<void>}
   */
  async disconnect() {
    // Optionnel
  }
}

export default BaseProvider;
