import { Service, CharacteristicValue, Logger } from 'homebridge';
import Qty from 'js-quantities';

import { InfinitivePlatform } from './platform';
import { Infinitive } from './infinitive';

export class Thermostat {
  private readonly log: Logger;
  private informationService: Service;
  private service: Service;

  constructor(
    private readonly platform: InfinitivePlatform,
    private readonly infinitive: Infinitive,
    private readonly name: string,
  ) {
    const {
      Name,
      CurrentHeatingCoolingState,
      TargetHeatingCoolingState,
      CurrentTemperature,
      TargetTemperature,
      TemperatureDisplayUnits,
      CurrentRelativeHumidity,
      CoolingThresholdTemperature,
      HeatingThresholdTemperature,
    } = this.platform.api.hap.Characteristic;

    this.log = this.platform.log;

    this.informationService = new this.platform.api.hap.Service.AccessoryInformation()
      .setCharacteristic(this.platform.api.hap.Characteristic.Manufacturer, 'Carrier')
      .setCharacteristic(this.platform.api.hap.Characteristic.Model, 'Infinitive')
      .setCharacteristic(this.platform.api.hap.Characteristic.SerialNumber, this.platform.config.url);

    this.service = new this.platform.api.hap.Service.Thermostat(this.name);

    this.service.setCharacteristic(Name, `${this.platform.config.name} Thermostat`);

    this.service.getCharacteristic(CurrentHeatingCoolingState)
      .onGet(this.getCurrentHeatingCoolingState.bind(this));

    this.service.getCharacteristic(TargetHeatingCoolingState)
      .onSet(this.setTargetHeatingCoolingState.bind(this))
      .onGet(this.getTargetHeatingCoolingState.bind(this));

    this.service.getCharacteristic(CurrentTemperature)
      .onGet(this.getCurrentTemperature.bind(this));

    this.service.getCharacteristic(TargetTemperature)
      .onSet(this.setTargetTemperature.bind(this))
      .onGet(this.getTargetTemperature.bind(this));

    this.service.getCharacteristic(TemperatureDisplayUnits)
      .onSet(this.setTemperatureDisplayUnits.bind(this))
      .onGet(this.getTemperatureDisplayUnits.bind(this));

    this.service.getCharacteristic(CurrentRelativeHumidity)
      .onGet(this.getCurrentRelativeHumidity.bind(this));

    this.service.getCharacteristic(CoolingThresholdTemperature)
      .onSet(this.setCoolingThresholdTemperature.bind(this))
      .onGet(this.getCoolingThresholdTemperature.bind(this));

    this.service.getCharacteristic(HeatingThresholdTemperature)
      .onSet(this.setHeatingThresholdTemperature.bind(this))
      .onGet(this.getHeatingThresholdTemperature.bind(this));
  }

  getServices() {
    return [
      this.informationService,
      this.service,
    ];
  }

  async getCurrentHeatingCoolingState(): Promise<CharacteristicValue> {
    const { CurrentHeatingCoolingState } = this.platform.api.hap.Characteristic;
    const {
      currentTemp,
      mode,
      heatSetpoint,
      coolSetpoint,
    } = await this.infinitive.fetchThermostatState();

    // TODO: a much easier way in Infinitive > 0.2 is to read the blower fan's
    // RPMs
    switch (mode) {
      case 'off':
        return CurrentHeatingCoolingState.OFF;
      case 'heat':
        return currentTemp < heatSetpoint ?
          CurrentHeatingCoolingState.HEAT :
          CurrentHeatingCoolingState.OFF;
      case 'electric':
        return currentTemp < heatSetpoint ?
          CurrentHeatingCoolingState.HEAT :
          CurrentHeatingCoolingState.OFF;
      case 'heatpump':
        return currentTemp < heatSetpoint ?
          CurrentHeatingCoolingState.HEAT :
          CurrentHeatingCoolingState.OFF;
      case 'cool':
        return currentTemp > coolSetpoint ?
          CurrentHeatingCoolingState.COOL :
          CurrentHeatingCoolingState.OFF;
      default:
        if (currentTemp < heatSetpoint) {
          return CurrentHeatingCoolingState.HEAT;
        } else if (currentTemp > coolSetpoint) {
          return CurrentHeatingCoolingState.COOL;
        } else {
          return CurrentHeatingCoolingState.OFF;
        }
    }
  }

  async getTargetHeatingCoolingState(): Promise<CharacteristicValue> {
    const { mode } = await this.infinitive.fetchThermostatState();
    const { TargetHeatingCoolingState } = this.platform.api.hap.Characteristic;

    switch (mode) {
      case 'off':
        return TargetHeatingCoolingState.OFF;
      case 'heat':
        return TargetHeatingCoolingState.HEAT;
      case 'electric':
        return TargetHeatingCoolingState.HEAT;
      case 'heatpump':
        return TargetHeatingCoolingState.HEAT;
      case 'cool':
        return TargetHeatingCoolingState.COOL;
      case 'auto':
        return TargetHeatingCoolingState.AUTO;
      default:
        this.log.error(`Invalid HeatingCoolingState ${mode}`);
        throw new this.platform.api.hap.HapStatusError(
          this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE,
        );
    }
  }

  async setTargetHeatingCoolingState(state: CharacteristicValue) {
    const {
      TargetHeatingCoolingState,
      TargetTemperature,
      CurrentHeatingCoolingState,
    } = this.platform.api.hap.Characteristic;
    const oldState = await this.infinitive.fetchThermostatState();
    const baseState = {
      fanMode: 'auto',
      hold: true,
    };

    switch (state) {
      case TargetHeatingCoolingState.OFF:
        this.infinitive.setThermostatState({ mode: 'off', ...baseState });
        break;
      case TargetHeatingCoolingState.HEAT:
        this.infinitive.setThermostatState({ mode: 'heat', ...baseState });
        this.service.updateCharacteristic(
          TargetTemperature,
          Qty(oldState.heatSetpoint, 'tempF').to('tempC').scalar,
        );
        break;
      case TargetHeatingCoolingState.COOL:
        this.infinitive.setThermostatState({ mode: 'cool', ...baseState });
        this.service.updateCharacteristic(
          TargetTemperature,
          Qty(oldState.coolSetpoint, 'tempF').to('tempC').scalar,
        );
        break;
      case TargetHeatingCoolingState.AUTO:
        this.infinitive.setThermostatState({ mode: 'auto', ...baseState });
        break;
      default:
        this.log.error(`Invalid HeatingCoolingState ${state}`);
        throw new this.platform.api.hap.HapStatusError(
          this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE,
        );
    }

    this.service.updateCharacteristic(
      CurrentHeatingCoolingState,
      await this.getCurrentHeatingCoolingState(),
    );
  }

  async getCurrentTemperature(): Promise<CharacteristicValue> {
    const state = await this.infinitive.fetchThermostatState();
    const temperature = Qty(state.currentTemp, 'tempF');

    return temperature.to('tempC').scalar;
  }

  async getTargetTemperature(): Promise<CharacteristicValue> {
    const state = await this.infinitive.fetchThermostatState();
    const { mode, currentTemp, heatSetpoint, coolSetpoint } = state;

    switch (mode) {
      case 'off':
        return 0;
      case 'auto':
        return Qty(
          currentTemp < heatSetpoint ? heatSetpoint : coolSetpoint,
          'tempF',
        ).to('tempC').scalar;
      case 'heat':
        return Qty(heatSetpoint, 'tempF').to('tempC').scalar;
      case 'electic':
        return Qty(heatSetpoint, 'tempF').to('tempC').scalar;
      case 'heatpump':
        return Qty(heatSetpoint, 'tempF').to('tempC').scalar;
      case 'cool':
        return Qty(coolSetpoint, 'tempF').to('tempC').scalar;
      default:
        this.log.error(`Invalid thermostat mode ${mode}`);
        throw new this.platform.api.hap.HapStatusError(
          this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE,
        );
    }
  }

  async setTargetTemperature(temperature: CharacteristicValue) {
    const {
      CurrentHeatingCoolingState,
    } = this.platform.api.hap.Characteristic;
    const state = await this.infinitive.fetchThermostatState();
    const { mode } = state;
    const tempC = Qty(temperature as number, 'tempC');
    const baseState = {
      fanMode: 'auto',
      hold: true,
    };

    switch (mode) {
      case 'heat':
        this.infinitive.setThermostatState({
          heatSetpoint: Math.round(tempC.to('tempF').scalar),
          ...baseState,
        });
        break;
      case 'cool':
        this.infinitive.setThermostatState({
          coolSetpoint: Math.round(tempC.to('tempF').scalar),
          ...baseState,
        });
        break;
      default:
        // 'auto' uses coolSetpoint and heatSetpoint sequentially
        this.infinitive.setThermostatState({
          ...baseState,
        });
    }

    this.service.updateCharacteristic(
      CurrentHeatingCoolingState,
      await this.getCurrentHeatingCoolingState(),
    );
  }

  async getTemperatureDisplayUnits(): Promise<CharacteristicValue> {
    const { TemperatureDisplayUnits } = this.platform.api.hap.Characteristic;
    return TemperatureDisplayUnits.FAHRENHEIT;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async setTemperatureDisplayUnits(unit: CharacteristicValue) {
    return;
  }

  async getCurrentRelativeHumidity(): Promise<CharacteristicValue> {
    const state = await this.infinitive.fetchThermostatState();

    return state.currentHumidity;
  }

  async getCoolingThresholdTemperature(): Promise<CharacteristicValue> {
    const state = await this.infinitive.fetchThermostatState();
    const tempC = Qty(state.coolSetpoint, 'tempF');

    return tempC.to('tempC').scalar;
  }

  async setCoolingThresholdTemperature(temperature: CharacteristicValue) {
    const {
      CurrentHeatingCoolingState,
    } = this.platform.api.hap.Characteristic;
    const tempC = Qty(temperature as number, 'tempC');

    await this.infinitive.setThermostatState({
      coolSetpoint: Math.round(tempC.to('tempF').scalar),
    });

    this.service.updateCharacteristic(
      CurrentHeatingCoolingState,
      await this.getCurrentHeatingCoolingState(),
    );
  }

  async getHeatingThresholdTemperature(): Promise<CharacteristicValue> {
    const state = await this.infinitive.fetchThermostatState();
    const tempC = Qty(state.heatSetpoint, 'tempF');

    return tempC.to('tempC').scalar;
  }

  async setHeatingThresholdTemperature(temperature: CharacteristicValue) {
    const {
      CurrentHeatingCoolingState,
    } = this.platform.api.hap.Characteristic;
    const tempC = Qty(temperature as number, 'tempC');

    await this.infinitive.setThermostatState({
      heatSetpoint: Math.round(tempC.to('tempF').scalar),
    });

    this.service.updateCharacteristic(
      CurrentHeatingCoolingState,
      await this.getCurrentHeatingCoolingState(),
    );
  }
}
