# VMS — Backend API Contract

Reference for the backend. It describes the data the VMS mobile app (iOS and Android, Expo / React Native) shows on each screen and the shape it expects from the server.

Every field name below matches the app's TypeScript types (`types/domain.ts`). Today the app fills these from simulated data on the phone. If the backend returns the same shapes, the app only needs its data layer swapped and the screens stay as they are.

Anything marked **Proposed** is a suggestion to discuss. Section 9 lists open questions.

---

## 1. What the app does

A passenger-safety app for someone riding in a chauffeured or fleet car. During a ride it shows:

- the car's live position, speed, heading and ETA on a map
- a safety score (0–100) and a status: `safe`, `caution` or `emergency`
- alerts from the in-car driver-monitoring system: drowsiness, distraction, harsh braking, route deviation, suspicious cabin activity, seat occupancy and SOS
- a live cabin camera feed (only after the passenger consents)
- recorded evidence clips attached to alerts
- trip history
- guardians (family or fleet desk) who get notified and can follow the trip
- an SOS button that alerts guardians

### Source of the data

```text
Car (Raspberry Pi: cameras, GPS, OBD-II, driver-monitoring model)
        │  telemetry, alerts, video
        ▼
Backend (API + realtime broker + video relay + storage + notifications)
        │  REST + realtime + video
        ▼
VMS mobile app
```

---

## 2. Screens and the data each one needs

| Screen | Shows | Data needed |
|---|---|---|
| **Live** (home) | Map with car marker, trail and route; passenger name; trip state ("On route" or "Returning"); destination; ETA; speed; safety ring; unread alert badge; Vehicle / Video / Audio / SOS buttons | Active ride, live telemetry, safety state, open alerts |
| **Vehicle** | Name, trim, colour, plate, photos, speed, heading, safety score, seat occupancy | Vehicle profile, live telemetry, seats |
| **Trips** | Live trip card plus past trips with status and safety pill | Ride list |
| **Trip detail** | Route on map, times, distance, status, safety status | One ride, with its route |
| **Cabin** | Consent gate, live cabin video, driver state (attentive, drowsy and so on), record button, SOS | Video stream URL, driver state, consent |
| **Alerts** | List of alerts, acknowledge one or all | Alerts, acknowledge endpoint |
| **Evidence** | Still or clip for one alert, with time, place and severity | Evidence media URL |
| **Family** (guardians) | Guardian list, add or remove, sharing on or off, notice history, share trip link | Guardians CRUD, notices, share link |
| **Settings** | Phone permissions, cabin consent, offline switch | Consent (optionally stored on the server) |

Screenshots of each screen are attached separately.

---

## 3. Conventions

- **Format:** JSON, UTF-8.
- **Timestamps:** Unix epoch in **milliseconds**, as a number (for example `1792735200000`). The app uses `Date.now()` throughout.
- **Coordinates:** `{ "latitude": number, "longitude": number }` in WGS84 decimal degrees.
- **IDs:** strings (for example `"ride-1842"`, `"bmw-m5"`).
- **Speed:** km/h. **Heading:** degrees from 0 to 360, where 0 is north. **Distance:** km in ride summaries.
- **Field case:** `camelCase`.
- **Errors** (proposed):

```json
{ "error": { "code": "RIDE_NOT_FOUND", "message": "Ride ride-1842 does not exist." } }
```

The app shows an error and retry state on every screen, so `message` should be readable by a passenger.

---

## 4. Data models

### 4.1 Enums

```ts
type DataOrigin   = "simulated" | "device" | "vehicle";   // backend data should use "vehicle"
type SafetyStatus = "safe" | "caution" | "emergency";
type Severity     = "info" | "low" | "medium" | "high" | "critical";
type RiskSeverity = "none" | "low" | "medium" | "high" | "critical";
type DriverState  = "attentive" | "drowsy" | "distracted" | "unavailable";
type AlertKind =
  | "harsh_braking"
  | "route_deviation"
  | "suspicious_activity"
  | "drowsiness"
  | "distraction"
  | "seat_occupancy"
  | "sos";
type RideStatus = "completed" | "interrupted";             // past rides
```

**Proposed:** add `"active"` to `RideStatus` for the ride in progress, instead of the app working that out.

### 4.2 Passenger

```json
{ "id": "p-1", "name": "Meera Shah", "seat": "Rear left", "phone": "+91 98450 22011" }
```

### 4.3 Driver

```json
{ "id": "d-1042", "name": "Arun Deshpande", "code": "DRV-1042", "note": "Must wear glasses" }
```

### 4.4 Vehicle

```json
{
  "id": "bmw-m5",
  "name": "BMW M5",
  "trim": "Competition",
  "color": "Alpine White",
  "plate": "KA 03 MH 5301",
  "cabinId": "CAB-18",
  "vinTail": "1842",
  "photos": [
    { "id": "ext-1", "kind": "exterior", "url": "https://…", "caption": "Front three-quarter" },
    { "id": "int-1", "kind": "interior", "url": "https://…", "caption": "Rear cabin" }
  ]
}
```

`photos` is **proposed**. The app bundles these images today.

### 4.5 Seat

```json
{ "id": "rear-left", "label": "Rear left", "occupied": true }
```

Seat IDs used now: `driver`, `front`, `rear-left`, `rear-right`.

### 4.6 Ride (trip)

Past rides use this shape (`PastTrip` in the app):

```json
{
  "id": "ride-1790",
  "originLabel": "UB City",
  "destinationLabel": "Indiranagar",
  "startedAt": 1792640000000,
  "endedAt": 1792641680000,
  "status": "completed",
  "distanceKm": 7.4,
  "safetyStatus": "caution",
  "route": [{ "latitude": 12.9719, "longitude": 77.6412 }],
  "position": { "latitude": 12.9716, "longitude": 77.5946 },
  "heading": 245
}
```

- `route` is the ordered polyline the map draws.
- `position` and `heading` are the car's last known point, used for the marker on the trip map.

**Active ride (proposed):** the same fields, plus:

```json
{
  "status": "active",
  "endedAt": null,
  "vehicleId": "bmw-m5",
  "passenger": { "...": "Passenger" },
  "driver": { "...": "Driver" },
  "origin": { "latitude": 12.9784, "longitude": 77.6408 },
  "destination": { "latitude": 12.9716, "longitude": 77.5963 },
  "plannedRoute": [{ "latitude": 0, "longitude": 0 }],
  "leg": "outbound"
}
```

`leg` is `"outbound"` or `"return"`. The app shows "On route" or "Returning".

### 4.7 Telemetry (live, roughly once per second)

```json
{
  "rideId": "ride-1842",
  "vehicleId": "bmw-m5",
  "at": 1792735200000,
  "position": { "latitude": 12.9741, "longitude": 77.6203 },
  "heading": 262,
  "speedKmh": 34,
  "etaMin": 9,
  "leg": "outbound"
}
```

The app draws the trail from the last 18 positions, so it doesn't need the trail sent.

### 4.8 Driver state and risk (live)

The app turns driver-monitoring output into a risk score. Example message:

```json
{
  "rideId": "ride-1842",
  "at": 1792735200000,
  "driverState": "distracted",
  "risk": {
    "score": 3,
    "severity": "medium",
    "action": "warning",
    "parts": ["attention:3"]
  }
}
```

`action` is `"none"`, `"warning"` or `"incident"`.

**Scoring rules the app uses today** (in `services/risk.ts`). The backend can reuse them, or send the raw inputs and let the app score them:

| Input | Points |
|---|---|
| `drowsiness` or `eye_state` | 3 (highest fatigue reading counts) |
| `yawn` | 1 |
| `distraction` | 2 |
| `gaze` | 1 (attention capped at 3) |
| activity `Phone Use` | 3 |
| activity `Drinking` or `Cigarette` | 2 |
| Vision-model event `phone` / `reaching` / `lying_down` | 2 (`phone` becomes 3 if the driver-monitoring system also sees phone use) |
| Vision-model `unusual_object` | 3 |
| Vision-model `altercation` | 5 |
| Vision-model confidence below 0.6 | ignored |
| SOS | score 11, `critical`, `incident` |

The score maps to severity like this: 5 or more is `high`, 3 or more is `medium`, 1 or more is `low`, otherwise `none`. Action is `incident` at 5 or more and `warning` at 3 or more.

The raw format, if the backend sends raw inputs instead:

```json
{
  "dmsReasons": ["drowsiness@0.81", "eye_state:closed@0.70"],
  "vlm": { "event": "unusual_object", "confidence": 0.72 }
}
```

Each reason string is `task[:label]@confidence`.

### 4.9 Safety status (app-side, for reference)

The app currently derives the safety status itself:

- **emergency:** any open alert is `sos` or `critical`, or risk is `high` or `critical`
- **caution:** any open alert is `high` or `medium`, or risk is `medium`
- **safe:** otherwise

The 0–100 safety index comes from the status and the risk score. If the backend computes these instead, send `{ "safetyStatus": "...", "safetyIndex": 0 }` with telemetry.

### 4.10 Alert

```json
{
  "id": "alert-7f3a",
  "tripId": "ride-1842",
  "kind": "distraction",
  "severity": "medium",
  "title": "Driver distraction",
  "detail": "Gaze left the road corridor. Attention points were applied.",
  "at": 1792735200000,
  "locationLabel": "Trinity Circle",
  "coordinate": { "latitude": 12.9730, "longitude": 77.6170 },
  "acknowledged": false,
  "evidenceId": "ev-91c2",
  "origin": "vehicle"
}
```

- `evidenceId` is left out when no media was kept. The app then shows "timeline card only".
- `locationLabel` is a short place name for display. Reverse geocoding on the backend is preferred.
- Default severity per kind in the app: `sos` is `critical`, `suspicious_activity` is `high`, `seat_occupancy` is `info`, and everything else is `medium`.
- Kinds that normally carry evidence: `harsh_braking`, `suspicious_activity`, `drowsiness`, `distraction` and `sos`.

### 4.11 Evidence

```json
{
  "id": "ev-91c2",
  "alertId": "alert-7f3a",
  "stillUrl": "https://…/still.jpg",
  "clipUrl": "https://…/clip.mp4",
  "durationSec": 12,
  "capturedAt": 1792735195000,
  "expiresAt": 1792821600000
}
```

Use signed, time-limited URLs. The app plays MP4 or HLS.

### 4.12 Guardian

```json
{
  "id": "g-priya",
  "name": "Priya Shah",
  "relationship": "Mother",
  "phone": "+91 98450 11008",
  "sharing": true,
  "lastNotifiedAt": 1792732680000
}
```

`lastNotifiedAt` is `null` if the guardian has never been notified.

### 4.13 Guardian notice

```json
{
  "id": "notice-4",
  "at": 1792735200000,
  "title": "SOS sent",
  "body": "Notified Priya Shah, Kabir Shah",
  "guardianNames": ["Priya Shah", "Kabir Shah"],
  "origin": "vehicle"
}
```

---

## 5. REST endpoints (proposed)

Base: `https://api.example.com/v1`. All endpoints require `Authorization: Bearer <token>`.

### Auth

| Method | Path | Purpose |
|---|---|---|
| POST | `/auth/otp/request` | `{ phone }`: send OTP |
| POST | `/auth/otp/verify` | `{ phone, code }` returns `{ accessToken, refreshToken, passenger }` |
| POST | `/auth/refresh` | `{ refreshToken }` returns new tokens |

### Rides

| Method | Path | Returns |
|---|---|---|
| GET | `/rides/active` | Active ride (4.6), or `204` when there is none |
| GET | `/rides?limit=20&cursor=…` | `{ items: Ride[], nextCursor }`, newest first |
| GET | `/rides/{rideId}` | One ride, including `route` |
| GET | `/rides/{rideId}/telemetry/latest` | Latest telemetry (4.7). Used on screen open, before realtime connects. |

### Vehicle

| Method | Path | Returns |
|---|---|---|
| GET | `/vehicles/{vehicleId}` | Vehicle (4.4) |
| GET | `/vehicles/{vehicleId}/seats` | `Seat[]` |

### Alerts and evidence

| Method | Path | Notes |
|---|---|---|
| GET | `/alerts?rideId=&since=&limit=` | `Alert[]`, newest first |
| POST | `/alerts/{alertId}/ack` | Returns the updated alert |
| POST | `/alerts/ack` | `{ rideId }`: acknowledge every open alert on the ride |
| GET | `/evidence/{evidenceId}` | Evidence (4.11) with signed URLs |

### Cabin

| Method | Path | Notes |
|---|---|---|
| PUT | `/rides/{rideId}/cabin-consent` | `{ allowed: boolean }`. The server must refuse to stream without consent. |
| POST | `/rides/{rideId}/cabin/session` | `{ camera: "cabin" \| "driver" }` returns `{ sessionId, streamUrl, protocol: "hls" \| "webrtc", expiresAt }` |
| POST | `/rides/{rideId}/cabin/recordings` | Start a passenger-initiated recording. Returns `{ recordingId }`. |
| POST | `/rides/{rideId}/cabin/recordings/{id}/stop` | Stop it. Returns the evidence object. |

### SOS

| Method | Path | Notes |
|---|---|---|
| POST | `/rides/{rideId}/sos` | `{ coordinate, at }` returns `{ id, at, alert, notice }` |

SOS must be **idempotent**. Accept an `Idempotency-Key` header, because the app retries on poor networks. The server notifies every guardian with `sharing: true` by SMS or push, and returns the created alert and notice.

### Guardians

| Method | Path | Notes |
|---|---|---|
| GET | `/guardians` | `Guardian[]` |
| POST | `/guardians` | `{ name, relationship, phone }` |
| PATCH | `/guardians/{id}` | `{ sharing?, name?, relationship?, phone? }` |
| DELETE | `/guardians/{id}` | |
| GET | `/guardians/notices?limit=` | `GuardianNotice[]` |
| POST | `/rides/{rideId}/share` | Returns `{ link, expiresAt }`. A public tracking link for guardians who don't have the app. |

### Calls (audio and video to the driver or fleet desk)

| Method | Path | Notes |
|---|---|---|
| POST | `/rides/{rideId}/calls` | `{ mode: "audio" \| "video" }` returns call credentials (provider token, room ID) |

The app's call states are `requesting`, `denied`, `ringing`, `live`, `ended` and `failed`. Tell us which call provider you choose (Agora, Twilio, LiveKit or similar).

### Push notifications

| Method | Path | Notes |
|---|---|---|
| POST | `/devices` | `{ expoPushToken, platform }`. Register the phone for alert and SOS push. |

---

## 6. Realtime (proposed)

The Live, Cabin and Alerts screens update continuously, so polling isn't enough.

**Preferred:** MQTT over secure WebSockets (`wss://`). The app already has an MQTT service slot and the `EXPO_PUBLIC_MQTT_URL` setting. **Also acceptable:** a plain WebSocket or Socket.IO channel with the same message types.

| Topic (MQTT) | Direction | Payload | Rate |
|---|---|---|---|
| `vms/ride/{rideId}/telemetry` | server to app | Telemetry (4.7) | about 1 Hz |
| `vms/ride/{rideId}/driver` | server to app | Driver state and risk (4.8) | on change |
| `vms/ride/{rideId}/alert` | server to app | Alert (4.10) | on event |
| `vms/ride/{rideId}/status` | server to app | `{ status: "active" \| "completed" \| "interrupted", at }` | on change |
| `vms/vehicle/{vehicleId}/presence` | server to app | `"online"` or `"offline"` (retained, last-will message) | on change |
| `vms/ride/{rideId}/sos` | app to server | `{ type: "sos", passenger, latitude, longitude }` | on press (the REST call is the source of truth) |

Requirements:

- Per-user credentials or a JWT. A passenger can subscribe only to their own ride's topics.
- After reconnecting, the app calls `/rides/{rideId}/telemetry/latest` and `/alerts?since=` to fill the gap.
- If a WebSocket is used instead, wrap messages as `{ "type": "telemetry" | "driver" | "alert" | "status", "data": { … } }`.

---

## 7. Video

| Use | Preferred format | Why |
|---|---|---|
| Live cabin feed | WebRTC (WHEP) page or HLS | WebRTC is under a second of delay. HLS is 2–5 seconds but simplest for the app. |
| Evidence clips | MP4 (H.264 and AAC) or HLS | Plays natively |
| Stills | JPEG | |

- Stream URLs must be short-lived and tied to the session from `/cabin/session`.
- The car runs on 4G behind NAT, so a relay is needed (MediaMTX, LiveKit, or a TURN server for WebRTC).

---

## 8. Privacy and security

- Cabin video only after passenger consent for **that ride**. Consent is recorded with a timestamp.
- Evidence media gets a retention period. Tell us the duration so the app can show it.
- Guardian phone numbers are personal data. Don't put them in realtime payloads.
- Use TLS everywhere, signed media URLs, and per-ride authorisation checks.

---

## 9. Open questions for the backend team

1. Who computes the risk score, safety status and safety index: the backend or the app?
2. One active ride per passenger, or several?
3. Who creates and ends rides? Driver app, fleet dashboard, or automatic from the ignition?
4. Is the planned route sent by the backend, or is only the destination known?
5. Realtime transport: MQTT over WebSockets, plain WebSocket, or Socket.IO?
6. Live video: HLS or WebRTC? Which relay?
7. Call provider for audio and video calls?
8. Which SMS or push provider for guardian notifications and SOS?
9. Evidence retention period, and can passengers delete it?
10. Auth method: phone OTP, or login through the fleet operator?
11. Environments and base URLs (dev, staging, prod), and a mock server or Postman collection we can use before the real API is ready.

---

## 10. What would help the app team most

- An OpenAPI (Swagger) spec for section 5 and example payloads for section 6
- A dev or staging server, or a mock server, with one seeded active ride that moves along a route and fires a few alerts
- Test credentials and a test vehicle ID
