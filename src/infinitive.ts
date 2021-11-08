import { fetchBuilder, MemoryCache } from 'node-fetch-cache';
import ow, { Infer } from 'ow';

const checkInfinitiveState = ow.object.partialShape({
  currentTemp: ow.number,
  currentHumidity: ow.number,
  outdoorTemp: ow.number,
  mode: ow.string,
  //stage: ow.number,
  fanMode: ow.string,
  hold: ow.boolean,
  heatSetpoint: ow.number,
  coolSetpoint: ow.number,
  //rawMode: ow.number
});

export type InfinitiveState = Infer<typeof checkInfinitiveState>;

export class Infinitive {
  private fetch;

  constructor(
    private readonly url: string,
    private readonly username?: string,
    private readonly password?: string,
  ) {
    this.purgeCache();
  }

  private purgeCache() {
    this.fetch = fetchBuilder.withCache(new MemoryCache({
      ttl: 250,
    }));
  }

  async fetchThermostatState(): Promise<InfinitiveState> {
    const username = this.username;
    const password = this.password;
    const headers = username && password ? {
      'Authorization': `Basic ${Buffer.from(username + ':' + password).toString('base64')}`,
    } : {};
    const res = await this.fetch(`${this.url}/api/zone/1/config`, {
      headers,
    });
    const state = await res.json();

    ow(state, checkInfinitiveState);

    return state;
  }

  async setThermostatState(newState: Partial<InfinitiveState>) {
    this.purgeCache();
    const username = this.username;
    const password = this.password;
    const headers = username && password ? {
      'Authorization': `Basic ${Buffer.from(username + ':' + password).toString('base64')}`,
    } : {};
    const res = await this.fetch(`${this.url}/api/zone/1/config`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify(newState),
    });

    if (!res.ok) {
      throw new Error(
        `setThermostatState failed (${res.status} ${res.statusText})`,
      );
    }
  }
}
