import { API, AccessoryPlugin, StaticPlatformPlugin, Logger, PlatformConfig } from 'homebridge';

import { Infinitive } from './infinitive';
import { Thermostat } from './thermostat';
import { OutdoorTemperature } from './outdoor_temperature';
import { OutdoorHumidity } from './outdoor_humidity';

/**
 * HomebridgePlatform
 * This class is the main constructor for your plugin, this is where you should
 * parse the user config and discover/register accessories with Homebridge.
 */
export class InfinitivePlatform implements StaticPlatformPlugin {
  private infinitive: Infinitive;

  constructor(
    public readonly log: Logger,
    public readonly config: PlatformConfig,
    public readonly api: API,
  ) {
    this.infinitive = new Infinitive(
      this.config.url,
      this.config.username,
      this.config.password,
    );
    this.log.debug('Finished initializing platform:', this.config.name);
  }

  accessories(callback: (foundAccessories: AccessoryPlugin[]) => void): void {
    const thermostat = new Thermostat(this, this.infinitive, `${this.config.name} Thermostat`);
    callback(this.config.includeOutdoorSensors ? [
      thermostat,
      new OutdoorTemperature(this, this.infinitive, `${this.config.name} Outdoor Temperature`),
      new OutdoorHumidity(this, this.infinitive, `${this.config.name} Outdoor Humidity`),
    ] :
      [ thermostat ]);
  }
}
