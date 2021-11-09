
<p align="center">

<img src="https://github.com/homebridge/branding/raw/master/logos/homebridge-wordmark-logo-vertical.png" width="150">

</p>


# homebridge-infinitive

A [Homebridge](https://github.com/nfarina/homebridge) plugin for
[Infinitive](https://github.com/acd/infinitive), a system that connects to a
Carrier Infinity HVAC serial control bus via an RS-485 dongle and allows for
networked control over the thermostat and HVAC units. `homebridge-infinitive`
exposes the following features to
[Apple HomeKit](https://www.apple.com/ios/home/):

- Read and set your thermostat's current temperature and heating/cooling mode.
- See whether your thermostat is actively heating or cooling.
- Set and store separate target temperatures for heating and cooling.
- Full support for auto mode and temperature setpoints.
- Multiple independent thermostats.
- Can optionally expose sensors representing outdoor temperature and humidity, measured at your HVAC cabinet.
- Voice control and automation via standard HomeKit features.

These features aren't implemented just yet:

- Non-HomeKit updates made to your HVAC system (through the thermostat or Infinitive API, for example) will not immediately push an update to HomeKit.

The following features are not supported:

- Thermostat-level scheduling or vacation mode. These are best done via HomeKit.
- Multi-zone Infinity control (requires Infinitive support).
- In-depth heat pump or electric heating control.

## Installation

First, get Infinitive working; its repo has fairly complete steps. My own
recommendations are to host Infinitive on a small embedded system like a
Raspberry Pi or any of the Pine64 SBCs, keep it indoors by connecting your
RS-485 adapter to your thermostat's A and B lines with short bits of wire
(you'll likely have to drill a couple of holes in your thermostat mount), and
host Infinitive behind a strong reverse proxy like Nginx with HTTP basic auth
enabled. See [my own configuration at home](https://github.com/unjordy/home-net)
for an example of a ruggedized Infinitive installation.

## Configuration

This section assumes you have a Homebridge installation and have installed this
plugin. If not, Homebridge's documentation around this is fairly complete.

The recommended way to configure this plugin is via [homebridge-config-ui-x](https://www.npmjs.com/package/homebridge-config-ui-x).

To manually configure the plugin, insert a section into your config with the
following fields:

| Field      | Value                                                            |
| ---------- | ---------------------------------------------------------------- |
| `platform` | Must be `infinitive`                                             |
| `name`     | A friendly name for the thermostat                               |
| `url`      | The base URL for the Infinitive server (IE, `http://infinitive`) |
| `username` | The HTTP basic auth username for the server (optional)           |
| `password` | The HTTP basic auth password for the server (optional)           |
| `includeOutdoorSensors` | Whether to include HomeKit sensors for outdoor temperature and humidity |
