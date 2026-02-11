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

  async listDevices() {
    try {
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
        device.isEnable === 1 &&
        device.isVisible === 1
      );

      // Convertir au format unifié
      return Promise.all(devices.map(d => this.toGenericDevice(d)));
    } catch (error) {
      console.error('Failed to list devices:', error.message);
      return [];
    }
  }

  async toGenericDevice(jeedomDevice) {
    const commands = await this.getCommands(jeedomDevice.id);

    return {
      id: jeedomDevice.id,
      name: jeedomDevice.name,
      type: this.detectType(jeedomDevice),
      capabilities: this.extractCapabilities(commands),
      command_mapping: {
        provider_type: 'jeedom',
        device_id: jeedomDevice.id,
        commands: this.buildCommandMapping(commands)
      }
    };
  }

  async getCommands(deviceId) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/core/api/jeeApi.php`,
        {
          jsonrpc: '2.0',
          id: '1',
          method: 'cmd::byEqLogicId',
          params: { apikey: this.apiKey, eqLogic_id: deviceId }
        }
      );
      return response.data.result || [];
    } catch (error) {
      console.error(`Failed to get commands for device ${deviceId}:`, error.message);
      return [];
    }
  }

  extractCapabilities(commands) {
    // Support de plusieurs types de generic_type pour toggle
    const toggleTypes = ['LIGHT_TOGGLE', 'ENERGY_TOGGLE', 'HEATING_TOGGLE'];
    const onTypes = ['LIGHT_ON', 'ENERGY_ON', 'HEATING_ON', 'SWITCH_ON'];
    const offTypes = ['LIGHT_OFF', 'ENERGY_OFF', 'HEATING_OFF', 'SWITCH_OFF'];

    return {
      toggle: commands.some(c =>
        toggleTypes.includes(c.generic_type) ||
        // Si on a ON + OFF, on peut toggler
        (commands.some(cmd => onTypes.includes(cmd.generic_type)) &&
         commands.some(cmd => offTypes.includes(cmd.generic_type)))
      ),
      dim: commands.some(c => c.generic_type === 'LIGHT_SLIDER'),
      color: commands.some(c => c.generic_type === 'LIGHT_COLOR'),
      temperature: commands.some(c => c.generic_type === 'LIGHT_SET_COLOR_TEMP')
    };
  }

  buildCommandMapping(commands) {
    const mapping = {};

    // Support de plusieurs types de generic_type
    const toggleTypes = ['LIGHT_TOGGLE', 'ENERGY_TOGGLE', 'HEATING_TOGGLE'];
    const onTypes = ['LIGHT_ON', 'ENERGY_ON', 'HEATING_ON', 'SWITCH_ON'];
    const offTypes = ['LIGHT_OFF', 'ENERGY_OFF', 'HEATING_OFF', 'SWITCH_OFF'];

    const toggleCmd = commands.find(c => toggleTypes.includes(c.generic_type));
    const onCmd = commands.find(c => onTypes.includes(c.generic_type));
    const offCmd = commands.find(c => offTypes.includes(c.generic_type));
    const dimCmd = commands.find(c => c.generic_type === 'LIGHT_SLIDER');
    const colorCmd = commands.find(c => c.generic_type === 'LIGHT_COLOR');

    if (toggleCmd) mapping.toggle = toggleCmd.id;
    if (onCmd) mapping.on = onCmd.id;
    if (offCmd) mapping.off = offCmd.id;
    if (dimCmd) mapping.dim = dimCmd.id;
    if (colorCmd) mapping.color = colorCmd.id;

    return mapping;
  }

  detectType(device) {
    if (device.eqType_name === 'light') return 'light';
    if (device.eqType_name === 'heating') return 'thermostat';
    return 'switch';
  }

  async executeCapability(deviceId, capability, params = {}) {
    try {
      // deviceId ici est le provider_device_id (ex: "13")
      // Il faudrait idéalement récupérer command_mapping depuis DB
      // Pour l'instant on cherche la commande
      const commands = await this.getCommands(deviceId);
      const mapping = this.buildCommandMapping(commands);
      const commandId = mapping[capability];

      if (!commandId) {
        throw new Error(`Capability '${capability}' not available for device ${deviceId}`);
      }

      const requestParams = {
        apikey: this.apiKey,
        id: parseInt(commandId)
      };

      if (capability === 'dim' && params.value !== undefined) {
        requestParams.options = { slider: params.value };
      }

      await axios.post(
        `${this.baseUrl}/core/api/jeeApi.php`,
        {
          jsonrpc: '2.0',
          id: '1',
          method: 'cmd::execCmd',
          params: requestParams
        }
      );
    } catch (error) {
      console.error('Failed to execute capability:', error.message);
      throw error;
    }
  }

  async getDeviceState(deviceId) {
    try {
      const commands = await this.getCommands(deviceId);
      const stateCmd = commands.find(c =>
        c.type === 'info' && c.generic_type === 'LIGHT_STATE_BOOL'
      );

      if (stateCmd) {
        const response = await axios.post(
          `${this.baseUrl}/core/api/jeeApi.php`,
          {
            jsonrpc: '2.0',
            id: '1',
            method: 'cmd::execCmd',
            params: { apikey: this.apiKey, id: stateCmd.id }
          }
        );
        return { isOn: response.data.result === 1 };
      }

      return {};
    } catch (error) {
      console.error('Failed to get device state:', error.message);
      return {};
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
          { timeout: 60000 }
        );

        if (response.data.result) {
          this.lastDatetime = response.data.result.datetime;
          if (response.data.result.result) {
            callback(response.data.result.result);
          }
        }

        setImmediate(poll);
      } catch (error) {
        console.error('Polling error:', error.message);
        setTimeout(poll, 5000);
      }
    };

    poll();
  }
}

export default JeedomProvider;
