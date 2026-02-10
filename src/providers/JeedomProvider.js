import BaseProvider from './BaseProvider.js';
import axios from 'axios';

class JeedomProvider extends BaseProvider {
  constructor(config) {
    super(config);
    this.baseUrl = config.url;
    this.apiKey = config.apiKey;
    this.lastDatetime = null;
  }

  async connect() {
    try {
      // Test connection avec JSON RPC
      const response = await axios.post(
        `${this.baseUrl}/core/api/jeeApi.php`,
        {
          jsonrpc: '2.0',
          id: '1',
          method: 'eqLogic::all',
          params: { apikey: this.apiKey }
        }
      );
      return response.status === 200 && response.data.result !== undefined;
    } catch (error) {
      console.error('Jeedom connection failed:', error.message);
      return false;
    }
  }

  async getDevices() {
    try {
      // Récupérer TOUS les équipements via JSON RPC
      const response = await axios.post(
        `${this.baseUrl}/core/api/jeeApi.php`,
        {
          jsonrpc: '2.0',
          id: '1',
          method: 'eqLogic::all',
          params: { apikey: this.apiKey }
        }
      );

      if (!response.data.result) {
        return [];
      }

      // Filtrer : uniquement les équipements virtuels actifs et visibles
      const devices = response.data.result.filter(device =>
        device.eqType_name === 'virtual' &&
        device.isEnable === '1' &&
        device.isVisible === '1'
      );

      // Normaliser les devices
      return devices.map(device => ({
        id: device.id,
        name: device.name,
        type: this._detectDeviceType(device),
        room: device.object_id,
        isEnabled: device.isEnable === '1',
        raw: device
      }));
    } catch (error) {
      console.error('Failed to get devices:', error.message);
      return [];
    }
  }

  async executeCommand(deviceId, command, params = {}) {
    try {
      // Exécuter une commande via JSON RPC
      const requestParams = {
        apikey: this.apiKey,
        id: parseInt(command)
      };

      // Si c'est un slider, ajouter les options
      if (params.value !== undefined) {
        requestParams.options = { slider: params.value };
      }

      const response = await axios.post(
        `${this.baseUrl}/core/api/jeeApi.php`,
        {
          jsonrpc: '2.0',
          id: '1',
          method: 'cmd::execCmd',
          params: requestParams
        }
      );

      return response.data.result;
    } catch (error) {
      console.error('Failed to execute command:', error.message);
      throw error;
    }
  }

  async subscribe(callback) {
    // Long polling avec event::changes
    const poll = async () => {
      try {
        const response = await axios.post(
          `${this.baseUrl}/core/api/jeeApi.php`,
          {
            jsonrpc: '2.0',
            id: '1',
            method: 'event::changes',
            params: {
              apikey: this.apiKey,
              datetime: this.lastDatetime || 0
            }
          },
          {
            timeout: 60000 // 60s timeout pour le long polling
          }
        );

        if (response.data.result) {
          this.lastDatetime = response.data.result.datetime;

          // Appeler le callback avec les changements
          if (response.data.result.result) {
            callback(response.data.result.result);
          }
        }

        // Continuer le polling
        setImmediate(poll);
      } catch (error) {
        console.error('Polling error:', error.message);
        // Retry après 5s en cas d'erreur
        setTimeout(poll, 5000);
      }
    };

    poll();
  }

  _detectDeviceType(device) {
    // Détecter le type via les commandes ou le type
    if (device.eqType_name === 'light') return 'light';
    if (device.eqType_name === 'heating') return 'heating';

    // Par défaut
    return 'switch';
  }
}

export default JeedomProvider;
