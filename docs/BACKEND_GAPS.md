# VMS Guardian API — Backend gaps & wishlist
  
App base: `http://51.81.81.118:8000` · Demo ride: `ride-1842` · Device: `orin-nano-01`

This document lists:

1. What already exists and is integrated in the phone app  
2. Ops fixes needed on current APIs  
3. Missing APIs required for current screens  
4. Should-add APIs for a full product  
5. Nice-to-haves  
6. Suggested priority order  


## 1. Already exists (app is integrated)

Keep these stable. The React Native app already calls them when `EXPO_PUBLIC_TELEMETRY_URL` is set.

| Method | Path | Used for |
|---|---|---|
| `GET` | `/health` | Boot / connection |
| `GET` | `/v1/rides/{rideId}` | Live ride snapshot |
| `GET` | `/v1/rides/{rideId}/alerts?status=` | Alerts list + filters (`all` / `open` / `caution` / `emergency`) |
| `POST` | `/v1/alerts/{alertId}/ack` | Acknowledge one alert |
| `POST` | `/v1/rides/{rideId}/sos` | Passenger SOS from phone |
| `POST` | `/v1/rides/{rideId}/telemetry` | Phone location for map |
| `GET` | `/v1/rides/{rideId}/cabin` | Driver state + seats + safety |
| `GET` | `/v1/rides/{rideId}/guardians` | Family list |
| `POST` | `/v1/rides/{rideId}/guardians` | Add guardian |
| `POST` | `/v1/rides/{rideId}/guardians/{guardianId}/sharing` | Toggle sharing |
| `POST` | `/v1/rides/{rideId}/share` | Refresh trip share link |
| `GET` | `/v1/rides/{rideId}/notices` | Notice history |
| `POST` | `/v1/devices/{guardianId}/push-token` | Store FCM token only (no delivery yet) |
| `WS` | `/v1/rides/{rideId}/live` | Live `telemetry` / `status` / `alert` / `sos` |

Swagger: `http://51.81.81.118:8000/docs`

---

## 2. Ops / data-quality fixes (no new API shape)

These unblock the current UI without new endpoints.

| Ask | Why |
|---|---|
| Keep `orin-nano-01` MQTT-connected and publishing heartbeats | So `deviceState` becomes `"online"` (app currently shows **Offline device**) |
| Publish real `position`, `heading`, `speedKmh`, `etaMin` | Live map metrics |
| Prefer `null` over `0` when ETA/speed are unknown | App treats `0` ETA as unset (`—`) |
| Populate `seats[]` with four slots (`driver`, `front`, `rear-left`, `rear-right`) | Cabin + Vehicle occupancy |
| Emit DMS / cabin alerts on the live socket and REST list | Alerts tab is empty until events exist |
| Set `locationLabel` on alerts | Readable place names in the timeline |
| Attach `evidenceId` when media is kept | Evidence deep-link can resolve later |
| Keep `updatedAt` fresh on heartbeats | Stale-device detection |

**Important:** bringing the device online unlocks live map / seats / alerts **data**. It does **not** unlock camera streaming, trip history, or evidence media — those need new APIs below.

---

## 3. Must-have missing APIs

### 3.1 Cabin camera stream

**Screen:** Cabin  
**Today:** `GET /cabin` returns status only — no `streamUrl`.

```http
PUT /v1/rides/{rideId}/cabin-consent
Content-Type: application/json

{ "allowed": true }
```

```http
POST /v1/rides/{rideId}/cabin/session
Content-Type: application/json

{ "camera": "cabin" | "driver", "consent": true }
```

```json
{
  "sessionId": "sess-…",
  "streamUrl": "https://…/index.m3u8",
  "protocol": "hls",
  "expiresAt": 1761563600000
}
```

`protocol` may be `"hls"` or `"webrtc"`.

```http
DELETE /v1/rides/{rideId}/cabin/session/{sessionId}
```

Rules:

- Refuse stream if consent is false / missing  
- Prefer short-lived signed URLs  
- Cabin video only after passenger consent for **that ride**

---

### 3.2 Evidence media

**Screen:** Evidence  
**Today:** alerts may include `evidenceId`, but there is no media fetch API.

```http
GET /v1/evidence/{evidenceId}
```

```json
{
  "id": "ev-91c2",
  "alertId": "alert-7f3a",
  "stillUrl": "https://…/still.jpg",
  "clipUrl": "https://…/clip.mp4",
  "durationSec": 12,
  "capturedAt": 1761560000000,
  "expiresAt": 1761646400000
}
```

Notes:

- `stillUrl` required when evidence exists  
- `clipUrl` optional  
- Use signed, expiring URLs  
- Kinds that normally carry evidence: `harsh_braking`, `suspicious_activity`, `drowsiness`, `distraction`, `sos`

---

### 3.3 Trip history

**Screen:** Trips (past rides)  
**Today:** only the active ride exists; app intentionally shows no fabricated history.

```http
GET /v1/rides?status=active|completed|interrupted&limit=20&cursor=
```

```json
{
  "rides": [
    {
      "id": "ride-1790",
      "originLabel": "UB City",
      "destinationLabel": "Indiranagar",
      "startedAt": 1761473600000,
      "endedAt": 1761475280000,
      "status": "completed",
      "distanceKm": 7.4,
      "safetyStatus": "caution",
      "route": [{ "latitude": 12.9719, "longitude": 77.6412 }],
      "position": { "latitude": 12.9716, "longitude": 77.5946 },
      "heading": 245,
      "passenger": "Meera Shah",
      "deviceId": "orin-nano-01"
    }
  ],
  "nextCursor": null
}
```

Also useful:

```http
GET /v1/rides/{rideId}/summary
```

Same shape as one history item, for trip detail of completed rides.

---

### 3.4 Planned route / destination on active ride

**Screen:** Live map / Trips map  
**Today:** only a single `position`; no planned polyline.

Extend **Ride**:

```json
{
  "originLabel": "Pickup",
  "destinationLabel": "Drop",
  "origin": { "latitude": 28.44, "longitude": 77.46 },
  "destination": { "latitude": 28.45, "longitude": 77.50 },
  "plannedRoute": [{ "latitude": 28.44, "longitude": 77.46 }],
  "leg": "outbound"
}
```

`leg`: `"outbound"` | `"return"`.

---

### 3.5 Guardian update / delete

**Screen:** Family  
**Today:** list, add, toggle sharing only. Remove is hidden in live mode.

```http
PATCH /v1/rides/{rideId}/guardians/{guardianId}
Content-Type: application/json

{ "name": "…", "relationship": "…", "phone": "…", "sharing": true }
```

```http
DELETE /v1/rides/{rideId}/guardians/{guardianId}
```

---

### 3.6 Real push notification delivery

**Today:** `POST /v1/devices/{guardianId}/push-token` stores a token; delivery is not implemented.

Needed:

1. Actually send FCM/APNs on SOS and critical alerts to guardians with `sharing: true`  
2. Prefer phone-centric registration:

```http
POST /v1/push/devices
Content-Type: application/json

{
  "token": "<fcm-or-apns>",
  "platform": "ios" | "android",
  "guardianId": "g-priya",
  "rideId": "ride-1842"
}
```

---

## 4. Should-add APIs (full product)

### 4.1 Vehicle / device profile

**Screen:** Vehicle details

```http
GET /v1/devices/{deviceId}
```

or

```http
GET /v1/vehicles/{vehicleId}
```

```json
{
  "id": "orin-nano-01",
  "name": "Fleet sedan",
  "trim": "…",
  "color": "…",
  "plate": "…",
  "deviceId": "orin-nano-01",
  "photos": [
    { "id": "ext-1", "kind": "exterior", "url": "https://…", "caption": "Front" }
  ]
}
```

### 4.2 Passenger + driver people

```http
GET /v1/rides/{rideId}/people
```

```json
{
  "passenger": { "id": "p-1", "name": "Meera Shah", "seat": "Rear left", "phone": "+91…" },
  "driver": { "id": "d-1042", "name": "Arun Deshpande", "code": "DRV-1042", "note": "Must wear glasses" }
}
```

### 4.3 Cabin recording

```http
POST /v1/rides/{rideId}/cabin/recordings/start
POST /v1/rides/{rideId}/cabin/recordings/{recordingId}/stop
```

Stop response should return an **Evidence** object (see 3.2).

### 4.4 Audio / video calls

**Screen:** Call overlay (today local-only UX)

```http
POST /v1/rides/{rideId}/calls
Content-Type: application/json

{ "mode": "audio" | "video" }
```

```json
{
  "callId": "call-…",
  "provider": "livekit" | "twilio" | "…",
  "token": "…",
  "roomId": "…",
  "expiresAt": 1761563600000
}
```

```http
POST /v1/rides/{rideId}/calls/{callId}/end
```

### 4.5 Auth (leave open demo mode)

```http
POST /v1/auth/otp/request   { "phone": "+91…" }
POST /v1/auth/otp/verify    { "phone", "code" } → { "accessToken", "refreshToken", "user" }
POST /v1/auth/refresh       { "refreshToken" }
```

Then require `Authorization: Bearer <accessToken>` on ride-scoped routes.

### 4.6 Bulk alert ack + pagination

```http
POST /v1/rides/{rideId}/alerts/ack-all
GET  /v1/rides/{rideId}/alerts?status=all&limit=50&cursor=
```

---

## 5. Nice-to-have / later

| Item | Notes |
|---|---|
| Geofence / route-deviation payloads | Include corridor or expected polyline |
| Fleet multi-ride list | `GET /v1/fleet/rides` for desk apps |
| Incident PDF / export | Post-trip report |
| Deep-link join tokens | `vms://trip/{id}?token=` with server validation |
| Idempotency-Key on SOS | Safe retries on poor networks |
| Consent audit log | Who allowed cabin, when |
| Webhook to fleet CRM on SOS | Outbound integration |
| Rate limits | Protect SOS / telemetry / share |
| Multi-language notice templates | Family notices |

---

## 6. What the app can show after each delivery

| Backend delivers | App can show |
|---|---|
| Device online + telemetry | Live pill, moving map, live speed / ETA / heading |
| DMS / cabin alerts | Alerts tab + live badge |
| Cabin `streamUrl` | Real camera on Cabin screen |
| Evidence URLs | Still / clip on Evidence screen |
| Trip history | Past trips list (not empty) |
| Planned route | Route line on Live / Trips map |
| Guardian DELETE/PATCH | Remove / edit family members |
| Push delivery | Phone notifications on SOS / critical alerts |
| Vehicle / people profiles | Real Vehicle + driver/passenger details |
| Call credentials | Real audio / video calls |
| Auth | Secured multi-user access |

---

## 7. Recommended priority

1. **Device online + live telemetry / seats / alerts** (ops + MQTT)  
2. **Cabin stream session API** (`streamUrl`)  
3. **Evidence media API** (`stillUrl` / `clipUrl`)  
4. **Trip history + planned route on Ride**  
5. **Guardian DELETE / PATCH**  
6. **Real push delivery**  
7. **Vehicle / driver / passenger profiles**  
8. **Calls + auth**

---

## 8. Conventions to keep

- JSON, UTF-8, **camelCase** field names  
- Epoch times in **milliseconds** for `at` / `lastNotifiedAt`  
- `updatedAt` as ISO-8601 string (as today)  
- Coordinates: `{ "latitude": number, "longitude": number }` (nullable where documented)  
- Errors: FastAPI `{ "detail": "…" }`  
- Seat ids: `driver` \| `front` \| `rear-left` \| `rear-right`  
- `safetyStatus`: `safe` \| `caution` \| `emergency`  
- `driverState`: `attentive` \| `drowsy` \| `distracted` \| `unavailable`  
- Alert `kind` / `severity` / `origin` as in [`FRONTEND_API.md`](../FRONTEND_API.md)

---

## 9. Open questions for backend

1. Cabin live video: **HLS** or **WebRTC**, and which relay?  
2. Call provider for audio/video?  
3. SMS vs push vs both for SOS guardian notify?  
4. Who owns planned route — vehicle, dispatch, or phone?  
5. Should phone `POST /telemetry` overwrite vehicle GPS, or only update a separate passenger fix?  
6. Auth model for guardians vs passenger vs fleet desk?  
7. Retention window for evidence media and cabin recordings?

---

## 10. Smoke checks after backend changes

```bash
curl -s http://51.81.81.118:8000/health
curl -s http://51.81.81.118:8000/v1/rides/ride-1842
curl -s "http://51.81.81.118:8000/v1/rides/ride-1842/alerts?status=all"
curl -s http://51.81.81.118:8000/v1/rides/ride-1842/cabin
curl -s http://51.81.81.118:8000/v1/rides/ride-1842/guardians
```

Expect when healthy and online:

- `"deviceState": "online"`  
- non-empty `seats` when occupancy is known  
- alerts appearing when DMS fires  
- (once built) cabin session returns a playable `streamUrl`  
- (once built) evidence id resolves to signed media URLs  
- (once built) `GET /v1/rides?status=completed` returns history
