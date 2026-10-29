# VMS

Passenger safety app for iOS and Android. The ride, cabin, alerts, calls, and family notices run on the phone. There is no live vehicle, camera feed, or dispatch service behind them.

## Run

Requires [Expo Go](https://expo.dev/go) for SDK 57.

```bash
npm install
npx expo start
```

Scan the QR code with Expo Go. Press `w` for the browser.

## Map

Google Maps is optional. Put a browser key in `.env` (gitignored):

```bash
GOOGLE_MAPS_API_KEY=
```

Restart Expo after changing it, and enable **Maps JavaScript API** on the key.

Without a key, Android and iOS use the map bundled with Expo Go. The browser draws the route without Google tiles. A store build reads the same key through the `react-native-maps` plugin in `app.config.ts`.

The app defaults to the demo guardian API:

```bash
EXPO_PUBLIC_TELEMETRY_URL=http://51.81.81.118:8000
EXPO_PUBLIC_RIDE_ID=ride-1842
EXPO_PUBLIC_DEVICE_ID=orin-nano-01
```

Swagger: `http://51.81.81.118:8000/docs`. Leave `EXPO_PUBLIC_MQTT_URL` empty — the phone talks only HTTP/WebSocket. Clear `EXPO_PUBLIC_TELEMETRY_URL` only if you intentionally want the on-phone simulation.

## Stored on the phone

Acknowledged alerts, guardians, trip notices, cabin consent, the phone-location dot, and the offline switch. The drive starts again each launch.
