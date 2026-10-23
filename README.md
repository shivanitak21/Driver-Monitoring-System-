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

Leave `EXPO_PUBLIC_TELEMETRY_URL` and `EXPO_PUBLIC_MQTT_URL` empty. This build does not open those connections.

## Stored on the phone

Acknowledged alerts, guardians, trip notices, cabin consent, the phone-location dot, and the offline switch. The drive starts again each launch.
