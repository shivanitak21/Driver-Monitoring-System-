# VMS

Simulated vehicle and passenger safety demo for iOS and Android. The moving car, cabin view, alerts, calls, and guardian notices are generated on the phone. Nothing in the app is a live vehicle, camera, microphone, GPS tracker, or guardian service.

## Run

Requires [Expo Go](https://expo.dev/go) for SDK 57.

```bash
npm install
npx expo start
```

Scan the QR code with Expo Go. Press `w` for the browser preview.

## Map

Google Maps is optional. Put a browser key in `.env` (this file is gitignored):

```bash
GOOGLE_MAPS_API_KEY=
```

Restart Expo after changing it. Enable **Maps JavaScript API** on that key.

Without a key, Android and iOS use the map bundled with Expo Go, and the browser shows a route sketch instead of Google tiles. A native store build also reads this key through the `react-native-maps` config plugin in `app.config.ts`. Do not commit the key.

`EXPO_PUBLIC_TELEMETRY_URL` and `EXPO_PUBLIC_MQTT_URL` stay empty. The app will not open those connections.

## What is stored on the phone

Acknowledged alerts, guardians, trip notices, cabin consent, the phone-location dot, and the offline preview switch are saved locally. The simulated drive starts again each launch.
