import { Service, CharacteristicValue } from 'homebridge';

import { InfinitivePlatform } from './platform';
import { Infinitive } from './infinitive';

export class OutdoorHumidity {
  private informationService: Service;
  private service: Service;

  constructor(
        private readonly platform: InfinitivePlatform,
        private readonly infinitive: Infinitive,
        private readonly name: string,
  ) {
    const {
      Name,
      CurrentRelativeHumidity,
    } = this.platform.api.hap.Characteristic;

    this.informationService = new this.platform.api.hap.Service.AccessoryInformation()
      .setCharacteristic(this.platform.api.hap.Characteristic.Manufacturer, 'Carrier')
      .setCharacteristic(this.platform.api.hap.Characteristic.Model, 'Infinitive')
      .setCharacteristic(this.platform.api.hap.Characteristic.SerialNumber, this.platform.config.url);

    this.service = new this.platform.api.hap.Service.HumiditySensor(this.name);

    this.service.setCharacteristic(Name, `${this.platform.config.name} Outdoor Humidity`);

    this.service.getCharacteristic(CurrentRelativeHumidity)
      .onGet(this.getCurrentRelativeHumidity.bind(this));
  }

  getServices() {
    return [
      this.informationService,
      this.service,
    ];
  }

  async getCurrentRelativeHumidity(): Promise<CharacteristicValue> {
    const { currentHumidity } = await this.infinitive.fetchThermostatState();

    return currentHumidity;
  }
}
