import JeedomProvider from './JeedomProvider.js';

const PROVIDERS = {
  'jeedom': JeedomProvider
  // 'mqtt': MQTTProvider,    // POST-MVP
  // 'ha': HAProvider         // POST-MVP
};

class ProviderFactory {
  /**
   * Créer une instance de provider
   * @param {string} type - Type du provider
   * @param {Object} config - Configuration
   * @returns {BaseProvider}
   */
  static create(type, config) {
    const ProviderClass = PROVIDERS[type];
    if (!ProviderClass) {
      throw new Error(`Provider type '${type}' not supported`);
    }
    return new ProviderClass(config);
  }

  /**
   * Liste des types de providers disponibles
   * @returns {Array<{type: string, name: string, description: string}>}
   */
  static getAvailableTypes() {
    return Object.keys(PROVIDERS).map(key => ({
      type: key,
      name: key.charAt(0).toUpperCase() + key.slice(1),
      description: this.getDescription(key)
    }));
  }

  /**
   * Description d'un provider
   * @param {string} type
   * @returns {string}
   */
  static getDescription(type) {
    const descriptions = {
      'jeedom': 'Jeedom home automation platform'
    };
    return descriptions[type] || '';
  }
}

export default ProviderFactory;
