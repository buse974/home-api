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
      // Test connection by fetching objects
      const response = await axios.get(
        `${this.baseUrl}/core/api/jeeApi.php`,
        {
          params: {
            apikey: this.apiKey,
            type: 'object'
          }
        }
      );
      return response.status === 200;
    } catch (error) {
      console.error('Jeedom connection failed:', error.message);
      return false;
    }
  }

  async getDevices() {
    try {
      // Récupérer les équipements
      const response = await axios.get(
        `${this.baseUrl}/core/api/jeeApi.php`,
        {
          params: {
            apikey: this.apiKey,
            type: 'eqLogic'
          }
        }
      );

      // Normaliser les devices
      return response.data.map(device => ({
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
      const url = `${this.baseUrl}/core/api/jeeApi.php`;
      const queryParams = {
        apikey: this.apiKey,
        type: 'command',
        id: command
      };

      // Si c'est un slider, ajouter la valeur
      if (params.value !== undefined) {
        queryParams.slider = params.value;
      }

      const response = await axios.get(url, { params: queryParams });
      return response.data;
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
