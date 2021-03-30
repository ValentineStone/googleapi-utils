# googleapi-utils

An assortment of Google Cloud utilities.

### Currently includes:
1. Firebase custom claim setter
2. Google IoT telemetry middleware

### Setup
1. `git clone https://github.com/ValentineStone/googleapi-utils`
2. `cd googleapi-utils`
3. `npm i`
4. `cp .env.example .env` and change it according to your setup

### Usage
`node telemetry proxy` to connect Google IoT to GCS over udp  
`node telemetry device` to connect serialport device to Google IoT  
`node telemetry serial-udp` to connect udp to serial directly (does not use Google IoT)  
`node claim <userId> <claim> <value>` set custom claim on firebase user  

### To generate keys
```
openssl ecparam -genkey -name prime256v1 -noout -out ec_private.pem
openssl ec -in ec_private.pem -pubout -out ec_public.pem
```

### keys.zip structure
Any amount of nested directories, within them the following files:
- `ec_private.pem` - pair private key
- `ec_private.pem` - pair public key
- `.env` - dotenv environment variables
- `credentials.json` - Google Cloud service account credentials
