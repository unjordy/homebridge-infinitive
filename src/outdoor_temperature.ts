import { Service, CharacteristicValue } from 'homebridge';
import Qty from 'js-quantities';

import { InfinitivePlatform } from './platform';
import { Infinitive } from './infinitive';

export class OutdoorTemperature {
  private informationService: Service;
  private service: Service;

  constructor(
        private readonly platform: InfinitivePlatform,
        private readonly infinitive: Infinitive,
        private readonly name: string,
  ) {
    const {
      Name,
      CurrentTemperature,
    } = this.platform.api.hap.Characteristic;

    this.informationService = new this.platform.api.hap.Service.AccessoryInformation()
      .setCharacteristic(this.platform.api.hap.Characteristic.Manufacturer, 'Carrier')
      .setCharacteristic(this.platform.api.hap.Characteristic.Model, 'Infinitive')
      .setCharacteristic(this.platform.api.hap.Characteristic.SerialNumber, this.platform.config.url);

    this.service = new this.platform.api.hap.Service.TemperatureSensor(this.name);

    this.service.setCharacteristic(Name, `${this.platform.config.name} Outdoor Temperature`);

    this.service.getCharacteristic(CurrentTemperature)
      .onGet(this.getCurrentTemperature.bind(this));
  }

  getServices() {
    return [
      this.informationService,
      this.service,
    ];
  }

  async getCurrentTemperature(): Promise<CharacteristicValue> {
    const state = await this.infinitive.fetchThermostatState();
    const temperature = Qty(state.outdoorTemp, 'tempF');

    return temperature.to('tempC').scalar;
  }
}
