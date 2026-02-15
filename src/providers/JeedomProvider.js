import BaseProvider from "./BaseProvider.js";
import axios from "axios";

const COMMANDS_CACHE_TTL_MS = 30_000;
const STATE_CACHE_TTL_MS = 1_200;
const commandsCache = new Map();
const stateCache = new Map();
const DEBUG_COMMAND_TRACE = true;

class JeedomProvider extends BaseProvider {
  constructor(config) {
    super(config);
    this.baseUrl = config.url;
    this.apiKey = config.apiKey;
    this.lastDatetime = null;
  }

  async connect() {
    try {
      const response = await axios.post(`${this.baseUrl}/core/api/jeeApi.php`, {
        jsonrpc: "2.0",
        id: "1",
        method: "eqLogic::all",
        params: { apikey: this.apiKey },
      });
      return response.status === 200 && response.data.result !== undefined;
    } catch (error) {
      console.error("Jeedom connection failed:", error.message);
      return false;
    }
  }

  async listDevices() {
    try {
      const response = await axios.post(`${this.baseUrl}/core/api/jeeApi.php`, {
        jsonrpc: "2.0",
        id: "1",
        method: "eqLogic::all",
        params: { apikey: this.apiKey },
      });

      if (!response.data.result) {
        return [];
      }

      // Filtrer : uniquement les équipements virtuels actifs et visibles
      const devices = response.data.result.filter(
        (device) =>
          device.eqType_name === "virtual" &&
          device.isEnable === 1 &&
          device.isVisible === 1,
      );

      // Convertir au format unifié
      return Promise.all(devices.map((d) => this.toGenericDevice(d)));
    } catch (error) {
      console.error("Failed to list devices:", error.message);
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
        provider_type: "jeedom",
        device_id: jeedomDevice.id,
        commands: this.buildCommandMapping(commands),
      },
    };
  }

  async getCommands(deviceId) {
    const cacheKey = `${this.baseUrl}|${deviceId}`;
    const now = Date.now();
    const cached = commandsCache.get(cacheKey);
    if (cached && now - cached.at < COMMANDS_CACHE_TTL_MS) {
      return cached.commands;
    }

    try {
      const response = await axios.post(`${this.baseUrl}/core/api/jeeApi.php`, {
        jsonrpc: "2.0",
        id: "1",
        method: "cmd::byEqLogicId",
        params: { apikey: this.apiKey, eqLogic_id: deviceId },
      });
      const commands = response.data.result || [];
      console.log(
        `📋 [Jeedom] Commands for device ${deviceId}:`,
        commands.map((c) => ({
          id: c.id,
          name: c.name,
          type: c.type,
          subType: c.subType,
          generic_type: c.generic_type,
        })),
      );
      commandsCache.set(cacheKey, { at: now, commands });
      return commands;
    } catch (error) {
      console.error(
        `Failed to get commands for device ${deviceId}:`,
        error.message,
      );
      return [];
    }
  }

  extractCapabilities(commands) {
    // Support de plusieurs types de generic_type pour toggle
    const toggleTypes = ["LIGHT_TOGGLE", "ENERGY_TOGGLE", "HEATING_TOGGLE"];
    const onTypes = ["LIGHT_ON", "ENERGY_ON", "HEATING_ON", "SWITCH_ON"];
    const offTypes = ["LIGHT_OFF", "ENERGY_OFF", "HEATING_OFF", "SWITCH_OFF"];

    return {
      toggle: commands.some(
        (c) =>
          toggleTypes.includes(c.generic_type) ||
          // Si on a ON + OFF, on peut toggler
          (commands.some((cmd) => onTypes.includes(cmd.generic_type)) &&
            commands.some((cmd) => offTypes.includes(cmd.generic_type))),
      ),
      dim: commands.some((c) => c.generic_type === "LIGHT_SLIDER"),
      color: commands.some((c) =>
        ["LIGHT_COLOR", "LIGHT_SET_COLOR"].includes(c.generic_type),
      ),
      temperature: commands.some(
        (c) => c.generic_type === "LIGHT_SET_COLOR_TEMP",
      ),
    };
  }

  buildCommandMapping(commands) {
    const mapping = {};

    // Support de plusieurs types de generic_type
    const toggleTypes = ["LIGHT_TOGGLE", "ENERGY_TOGGLE", "HEATING_TOGGLE"];
    const onTypes = ["LIGHT_ON", "ENERGY_ON", "HEATING_ON", "SWITCH_ON"];
    const offTypes = ["LIGHT_OFF", "ENERGY_OFF", "HEATING_OFF", "SWITCH_OFF"];

    // Chercher d'abord par generic_type
    let toggleCmd = commands.find((c) => toggleTypes.includes(c.generic_type));
    let onCmd = commands.find((c) => onTypes.includes(c.generic_type));
    let offCmd = commands.find((c) => offTypes.includes(c.generic_type));
    const dimCmd = commands.find((c) => c.generic_type === "LIGHT_SLIDER");
    const colorCmd = commands.find((c) =>
      ["LIGHT_SET_COLOR", "LIGHT_COLOR"].includes(c.generic_type),
    );
    const temperatureCmd = commands.find(
      (c) => c.generic_type === "LIGHT_SET_COLOR_TEMP",
    );

    // Fallback : chercher par nom de commande (plus robuste si generic_type non configuré)
    if (!toggleCmd) {
      toggleCmd = commands.find(
        (c) => c.type === "action" && c.name.toLowerCase() === "toggle",
      );
    }
    if (!onCmd) {
      onCmd = commands.find(
        (c) => c.type === "action" && c.name.toLowerCase() === "on",
      );
    }
    if (!offCmd) {
      offCmd = commands.find(
        (c) => c.type === "action" && c.name.toLowerCase() === "off",
      );
    }

    if (toggleCmd) mapping.toggle = toggleCmd.id;
    if (onCmd) mapping.on = onCmd.id;
    if (offCmd) mapping.off = offCmd.id;
    if (dimCmd) mapping.dim = dimCmd.id;
    if (colorCmd) mapping.color = colorCmd.id;
    if (temperatureCmd) mapping.temperature = temperatureCmd.id;

    console.log(`🗺️  [Jeedom] Command mapping:`, mapping);
    return mapping;
  }

  detectType(device) {
    if (device.eqType_name === "light") return "light";
    if (device.eqType_name === "heating") return "thermostat";
    return "switch";
  }

  async executeCapability(deviceId, capability, params = {}) {
    try {
      // deviceId ici est le provider_device_id (ex: "13")
      // Il faudrait idéalement récupérer command_mapping depuis DB
      // Pour l'instant on cherche la commande
      const commands = await this.getCommands(deviceId);
      const mapping = this.buildCommandMapping(commands);
      let effectiveCapability = capability;
      let effectiveParams = params;
      let commandId = mapping[effectiveCapability];

      if (
        effectiveCapability === "color" &&
        !commandId &&
        mapping.temperature
      ) {
        const hueValue = Number(params?.hue);
        const normalized = Number.isFinite(hueValue)
          ? Math.abs(((hueValue % 360) - 180) / 180)
          : 0.5;
        const value = Math.round((1 - normalized) * 100);
        const kelvin = Math.round(2200 + (value / 100) * (6500 - 2200));
        effectiveCapability = "temperature";
        effectiveParams = {
          ...params,
          value,
          kelvin,
          source: "api-color-fallback",
        };
        commandId = mapping.temperature;
      }

      if (DEBUG_COMMAND_TRACE) {
        console.log("🧭 [Jeedom][Trace] execute start:", {
          deviceId,
          capability,
          effectiveCapability,
          params,
          effectiveParams,
          mapping,
        });
      }

      // IMPORTANT:
      // Pour éviter les "toggle" Jeedom ambigus/mal mappés (ex: commande qui force ON),
      // on privilégie systématiquement ON/OFF quand ils sont disponibles.
      if (effectiveCapability === "toggle" && (mapping.on || mapping.off)) {
        console.log(
          `📌 Toggle piloté par état pour device ${deviceId} (priorité on/off)`,
        );
        const hasDesiredState =
          typeof effectiveParams?.desiredState === "boolean";
        if (hasDesiredState) {
          commandId = effectiveParams.desiredState ? mapping.on : mapping.off;
        } else {
          const state = await this.getDeviceState(deviceId);
          commandId = state.isOn ? mapping.off : mapping.on;
        }

        if (!commandId) {
          // Fallback final sur la commande toggle native si l'une des commandes manque
          commandId = mapping.toggle;
        }
      }

      // Si toggle demandé et pas de on/off, fallback sur toggle natif
      if (!commandId && effectiveCapability === "toggle") {
        commandId = mapping.toggle;
      }

      if (!commandId) {
        throw new Error(
          `Capability '${effectiveCapability}' not available for device ${deviceId}`,
        );
      }

      const commandDefinition = commands.find(
        (command) => Number(command.id) === Number(commandId),
      );

      const resolveSliderBounds = (command) => {
        const minCandidates = [
          command?.minValue,
          command?.configuration?.minValue,
          command?.display?.minValue,
          command?.template?.dashboard?.minValue,
        ];
        const maxCandidates = [
          command?.maxValue,
          command?.configuration?.maxValue,
          command?.display?.maxValue,
          command?.template?.dashboard?.maxValue,
        ];

        const min = minCandidates
          .map((value) => Number(value))
          .find((value) => Number.isFinite(value));
        const max = maxCandidates
          .map((value) => Number(value))
          .find((value) => Number.isFinite(value));

        return {
          min: min ?? null,
          max: max ?? null,
        };
      };

      const normalizeSliderValue = (inputValue, command, fallbackBounds) => {
        const numericValue = Number(inputValue);
        if (!Number.isFinite(numericValue)) return null;

        const bounds = resolveSliderBounds(command);
        const min = bounds.min ?? fallbackBounds.min;
        const max = bounds.max ?? fallbackBounds.max;

        if (min === null || max === null || max <= min) {
          return Math.round(numericValue);
        }

        // If UI sends percent (0-100), scale it to command range.
        if (
          numericValue >= 0 &&
          numericValue <= 100 &&
          (min !== 0 || max !== 100)
        ) {
          const scaled = min + (numericValue / 100) * (max - min);
          return Math.round(scaled);
        }

        return Math.round(Math.min(max, Math.max(min, numericValue)));
      };

      const requestParams = {
        apikey: this.apiKey,
        id: parseInt(commandId),
      };

      if (
        effectiveCapability === "dim" &&
        effectiveParams.value !== undefined
      ) {
        const detectedBounds = resolveSliderBounds(commandDefinition);
        const sliderValue = normalizeSliderValue(
          effectiveParams.value,
          commandDefinition,
          {
            min: 0,
            max: 254,
          },
        );
        if (DEBUG_COMMAND_TRACE) {
          console.log("🎚️ [Jeedom][Trace] dim slider conversion:", {
            input: params.value,
            effectiveInput: effectiveParams.value,
            detectedBounds,
            fallbackBounds: { min: 0, max: 254 },
            output: sliderValue,
            commandId,
            commandName: commandDefinition?.name,
            commandGenericType: commandDefinition?.generic_type,
          });
        }
        if (sliderValue !== null) {
          requestParams.options = { slider: sliderValue };
        }
      }

      if (effectiveCapability === "color") {
        const colorValue =
          effectiveParams?.hex ||
          effectiveParams?.color ||
          effectiveParams?.value ||
          (effectiveParams?.r !== undefined &&
          effectiveParams?.g !== undefined &&
          effectiveParams?.b !== undefined
            ? `#${Number(effectiveParams.r).toString(16).padStart(2, "0")}${Number(
                effectiveParams.g,
              )
                .toString(16)
                .padStart(2, "0")}${Number(effectiveParams.b)
                .toString(16)
                .padStart(2, "0")}`
            : undefined);

        if (colorValue !== undefined) {
          requestParams.options = {
            ...(requestParams.options || {}),
            color: colorValue,
          };
        }
      }

      if (
        effectiveCapability === "temperature" &&
        effectiveParams?.value !== undefined
      ) {
        const detectedBounds = resolveSliderBounds(commandDefinition);
        const sliderValue = normalizeSliderValue(
          effectiveParams.value,
          commandDefinition,
          {
            min: 153,
            max: 500,
          },
        );
        requestParams.options = {
          ...(requestParams.options || {}),
          slider:
            sliderValue !== null ? sliderValue : Number(effectiveParams.value),
        };
        if (DEBUG_COMMAND_TRACE) {
          console.log("🌡️ [Jeedom][Trace] temperature slider conversion:", {
            input: params.value,
            effectiveInput: effectiveParams.value,
            kelvin: effectiveParams?.kelvin,
            detectedBounds,
            fallbackBounds: { min: 153, max: 500 },
            output: requestParams.options.slider,
            commandId,
            commandName: commandDefinition?.name,
            commandGenericType: commandDefinition?.generic_type,
          });
        }
      }

      console.log(
        `🚀 [Jeedom] Executing command ${commandId} (capability: ${effectiveCapability}) for device ${deviceId}`,
        requestParams,
      );

      const response = await axios.post(`${this.baseUrl}/core/api/jeeApi.php`, {
        jsonrpc: "2.0",
        id: "1",
        method: "cmd::execCmd",
        params: requestParams,
      });

      console.log(`✅ [Jeedom] Response:`, response.data);
      if (DEBUG_COMMAND_TRACE) {
        console.log("📨 [Jeedom][Trace] execute end:", {
          deviceId,
          capability,
          effectiveCapability,
          commandId,
          commandName: commandDefinition?.name,
          commandGenericType: commandDefinition?.generic_type,
          requestOptions: requestParams.options || null,
          result: response.data?.result,
          error: response.data?.error || null,
        });
      }
      const stateCacheKey = `${this.baseUrl}|${deviceId}`;
      stateCache.delete(stateCacheKey);
    } catch (error) {
      console.error("❌ [Jeedom] Failed to execute capability:", error.message);
      if (error.response) {
        console.error("Response data:", error.response.data);
      }
      throw error;
    }
  }

  async getDeviceState(deviceId) {
    const stateCacheKey = `${this.baseUrl}|${deviceId}`;
    const now = Date.now();
    const cachedState = stateCache.get(stateCacheKey);
    if (cachedState && now - cachedState.at < STATE_CACHE_TTL_MS) {
      return cachedState.state;
    }

    try {
      const commands = await this.getCommands(deviceId);

      // Chercher une commande d'état (plusieurs generic_type possibles)
      const stateTypes = [
        "LIGHT_STATE",
        "LIGHT_STATE_BOOL",
        "ENERGY_STATE",
        "HEATING_STATE",
        "SWITCH_STATE",
      ];
      let stateCmd = commands.find(
        (c) => c.type === "info" && stateTypes.includes(c.generic_type),
      );

      // Fallback 1 : nom explicite (etat/state/status)
      if (!stateCmd) {
        stateCmd = commands.find((c) => {
          if (c.type !== "info") return false;
          const label = `${c.name || ""} ${c.logicalId || ""}`.toLowerCase();
          return /etat|state|status/.test(label);
        });
      }

      // Fallback 2 : commande info binary/numeric/string
      if (!stateCmd) {
        stateCmd = commands.find((c) => {
          if (c.type !== "info") return false;
          return (
            c.subType === "binary" ||
            c.subType === "numeric" ||
            c.subType === "string"
          );
        });
      }

      const normalizeIsOn = (value, depth = 0) => {
        if (value === null || value === undefined) return undefined;
        if (typeof value === "object") {
          if (depth > 4) return undefined;

          if (value.value !== undefined)
            return normalizeIsOn(value.value, depth + 1);
          if (value.state !== undefined)
            return normalizeIsOn(value.state, depth + 1);
          if (value.result !== undefined) {
            return normalizeIsOn(value.result, depth + 1);
          }
          if (value.cmd !== undefined)
            return normalizeIsOn(value.cmd, depth + 1);

          // Some Jeedom plugins return objects with dynamic keys
          // (ex: {"224":"1"} or {"0":{"value":1}}). Try values recursively.
          const nestedValues = Object.values(value);
          for (const nested of nestedValues) {
            const parsed = normalizeIsOn(nested, depth + 1);
            if (typeof parsed === "boolean") return parsed;
          }
          return undefined;
        }
        if (typeof value === "boolean") return value;
        if (typeof value === "number") return value > 0;

        if (typeof value === "string") {
          const normalized = value.trim().toLowerCase();
          if (
            normalized === "1" ||
            normalized === "on" ||
            normalized === "true" ||
            normalized === "open" ||
            normalized === "active"
          ) {
            return true;
          }
          if (
            normalized === "0" ||
            normalized === "off" ||
            normalized === "false" ||
            normalized === "closed" ||
            normalized === "inactive"
          ) {
            return false;
          }

          const asNumber = Number(normalized);
          if (!Number.isNaN(asNumber)) {
            return asNumber > 0;
          }
        }

        return undefined;
      };

      if (!stateCmd) {
        // Dernier fallback: parser directement le cache Jeedom si présent
        const cachedState = commands.find((c) => c.type === "info" && c.state);
        if (cachedState) {
          const rawValue = cachedState.state;
          const isOn = normalizeIsOn(rawValue);
          return { isOn, rawValue, source: "cached-info-state" };
        }
      }

      if (stateCmd) {
        const response = await axios.post(
          `${this.baseUrl}/core/api/jeeApi.php`,
          {
            jsonrpc: "2.0",
            id: "1",
            method: "cmd::execCmd",
            params: { apikey: this.apiKey, id: stateCmd.id },
          },
        );
        const rawValue = response.data.result;
        const isOn = normalizeIsOn(rawValue);
        const state = { isOn, rawValue, source: "cmd::execCmd" };
        console.log(
          `💡 [Jeedom] Device ${deviceId} state: raw=${JSON.stringify(rawValue)}, isOn=${isOn}`,
        );
        stateCache.set(stateCacheKey, { at: now, state });
        return state;
      }

      console.log(`⚠️  [Jeedom] No state command found for device ${deviceId}`);
      return {};
    } catch (error) {
      console.error("Failed to get device state:", error.message);
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
            jsonrpc: "2.0",
            id: "1",
            method: "event::changes",
            params: {
              apikey: this.apiKey,
              datetime: this.lastDatetime || 0,
            },
          },
          { timeout: 60000 },
        );

        if (response.data.result) {
          this.lastDatetime = response.data.result.datetime;
          if (response.data.result.result) {
            callback(response.data.result.result);
          }
        }

        setImmediate(poll);
      } catch (error) {
        console.error("Polling error:", error.message);
        setTimeout(poll, 5000);
      }
    };

    poll();
  }
}

export default JeedomProvider;
