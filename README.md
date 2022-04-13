# googleapi-utils

An assortment of Google Cloud utilities.

## Currently includes:
1. Firebase custom claim setter
2. UUID generator
3. Firebase Realtime Database manipulation cli
4. Assortmet of Google Cloud network and utility middleware (adapters) for streaming data between endpoints
    - `pubsub` - Google Cloud Pub/Sub powered P2P tunnel (spawns necessary resources automatically)
    - `google-iot` - [Google IoT Commands](https://cloud.google.com/iot/docs/how-tos/commands) powered P2P tunnel (spawns necessary resources automatically)
    - `google-iot-controlled` - `google-iot`, but with TCP-like session managment
    - `serialport` - An adapter-wrapper for [`serialport`](https://www.npmjs.com/package/serialport)
    - `udp` - Adapter-wrapper for UDP (dgram) server (listens on (owns) a given ip and port)
    - `udp-proxy` - Adapter-wrapper for UDP (dgram) client (talks to a given ip and port)
    - `chain` - as the name implies, chain multiple adapters together, creating a data conveyor
    - `measure` - measure and log any adapter's input/output
    - `throttle` - Throttles the bytes sent by delaying send untill a given amount of bytes is ready to be sent
    - `transform` - Arbitrarily transform input and output (can be used for logging or sideeffects)
    - *`atcp` - Abstract pure js TCP implementation (not finished, does not work)*

## Setup
1. `git clone https://github.com/ValentineStone/googleapi-utils`
2. `cd googleapi-utils`
3. `npm i`
4. `cp .env.example .env` and change it according to your setup

## Usage
### Claim
`node claim <userId> <claim> <value>` set custom claim on firebase user
### Random string
`node rstr <length> <symbols> <firstsymbols>`  
Generate random string of `length` symbols consisting of `symbols`.  
If `firstsymbols` is present the first symbol of the string will be selected from it.

Default parameters are:
```
length = 32
symbols = abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789~`!@#$%^&*()_-+={[}]|\:;"\'<,>.?/
firstsymbols = abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ
```
### UUID
`node uuid <name> <namespace>` to generate a UUID-5 (if `name` is not provided is it set to `Date.now() + '-' + Math.random()`)
### Firebase Realtime Database
`node rtdb mv [--push] <from> <to>` move value  
`node rtdb cp [--push] <from> <to>` copy value  
`node rtdb rm <path>` remove value from path  
`node rtdb set [--push] <path> <value>` set value  
`node rtdb get <path>` get value, duh

None of the methods that change the database would override an existing path, you need to remove whatever is there before you can write anything new. If you want to just add an item to a collection with an auto generated Firebase key use `--push`, like so:
```sh
node rtdb set --push /badguys '{ "name": "Mare-do-well", "type": "pony" }'
# > setting...
# > set /badguys/-M_vA9s0ksgQHI54DUF9
# Whops, Mare-do-well is not a villan, she is a hero, lets fix that
node rtdb mv --push /badguys/-M_vA9s0ksgQHI54DUF9 /goodguys
# > moving...
# > moved /badguys/-M_vA9s0ksgQHI54DUF9 to /goodguys/-M_vAODTlncCrpePrYeZ
# But she has an evil invisible twin sister,
# lets copy the record and change it accordingly
node rtdb cp --push /goodguys/-M_vAODTlncCrpePrYeZ /badguys
# > copying...
# > copied /goodguys/-M_vAODTlncCrpePrYeZ to /badguys/-M_vAg7zsv3xie7bBlIU
# For security reasons there is no way to change a value in this cli,
# so lets remove the name and set the new one
node rtdb rm /badguys/-M_vAg7zsv3xie7bBlIU/name
# > removing...
# > removed /badguys/-M_vAg7zsv3xie7bBlIU/nam
node rtdb set /badguys/-M_vAg7zsv3xie7bBlIU/name "Ne'er-do-well"
# > setting...
# > set /badguys/-M_vAg7zsv3xie7bBlIU/name
# Lets check our handywork
node rtdb get /badguys
# > getting...
# > { '-M_vAg7zsv3xie7bBlIU': { name: "Ne'er-do-well" } }
node rtdb get /goodguys
# > getting...
# > { '-M_vAODTlncCrpePrYeZ': { name: 'Mare-do-well' } }
# Glorious work!
```