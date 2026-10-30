# Guardian app API

Contract for the phone app. The app talks only to this HTTP API and, for live video, to the LiveKit URL returned by this API. Do not connect the app to MQTT, the Jetson, or port `7880` with a secret of your own.

Interactive list of the same routes: `GET {BASE}/docs`

## Setup

```bash
EXPO_PUBLIC_TELEMETRY_URL=http://YOUR_VPS_IP:8000
EXPO_PUBLIC_MQTT_URL=
```

No trailing slash on the base URL. Leave `EXPO_PUBLIC_MQTT_URL` empty.

| Value | Current production |
|---|---|
| Base URL | `http://YOUR_VPS_IP:8000` |
| Ride id | `ride-1842` |
| Device id | `orin-nano-01` |

There is no auth header. CORS allows any origin. Unknown rides return `404` with `{ "detail": "ride not found" }`. Sharing off returns `403` with `{ "detail": "sharing is off" }` on video, frames, and clips.

Times named `at`, `startedAt`, `endedAt`, `expiresAt`, and `lastNotifiedAt` are Unix epoch **milliseconds**. `updatedAt` is an ISO-8601 string.

Do not put these in the app: `MEDIA_DEVICE_KEY`, `LIVEKIT_API_SECRET`, MQTT password, EMQX dashboard password.

---

## What the app calls

| Screen | Call |
|---|---|
| Trip home | `GET /v1/rides/{rideId}` once, then WebSocket `/v1/rides/{rideId}/live` |
| Device online | `ride.deviceState` and `ride.publisherOnline` from the ride or the `status` socket event |
| Map | `POST /v1/rides/{rideId}/telemetry` |
| Alerts | `GET /v1/rides/{rideId}/alerts`, then socket `alert` / `sos`. Ack with `POST /v1/alerts/{alertId}/ack` |
| VLM text | `GET /v1/rides/{rideId}/analysis?channel=dms` or `cms`, then socket `analysis` |
| Live still | `GET /v1/rides/{rideId}/frames/live?channel=dms` or `cms` |
| Live video | `GET /v1/rides/{rideId}/video`, then connect LiveKit with `url` + `token` |
| Past trips | `GET /v1/history?deviceId=orin-nano-01` |
| Alert clip | `GET /v1/rides/{rideId}/clips/{clipId}` |
| SOS | `POST /v1/rides/{rideId}/sos` |
| Cabin seats | `GET /v1/rides/{rideId}/cabin` |
| Guardians | list, `POST` to add, `POST .../sharing` to toggle |
| Share link | `POST /v1/rides/{rideId}/share` |
| Notices | `GET /v1/rides/{rideId}/notices` |
| Push token | `POST /v1/devices/{guardianId}/push-token` |

There is no `PATCH` or `DELETE` for guardians, rides, or alerts.

---

## Ride

`GET /v1/rides/{rideId}`

```json
{
  "id": "ride-1842",
  "deviceId": "orin-nano-01",
  "passenger": "Meera Shah",
  "safetyStatus": "safe",
  "driverState": "attentive",
  "deviceState": "online",
  "etaMin": 12,
  "speedKmh": 34.5,
  "heading": 90,
  "score": 98,
  "shareLink": "vms://trip/ride-1842",
  "position": { "latitude": 12.9716, "longitude": 77.5946 },
  "seats": [
    { "id": "driver", "label": "Driver", "occupied": true },
    { "id": "front", "label": "Front", "occupied": false },
    { "id": "rear-left", "label": "Rear Left", "occupied": true },
    { "id": "rear-right", "label": "Rear Right", "occupied": false }
  ],
  "updatedAt": "2026-10-28T10:15:00+00:00",
  "publisherOnline": true,
  "status": "active",
  "startedAt": 1761560000000,
  "endedAt": null
}
```

| Field | Values |
|---|---|
| `safetyStatus` | `safe`, `caution`, `emergency` |
| `driverState` | `attentive`, `drowsy`, `distracted`, `unavailable` |
| `deviceState` | `online` or `offline`. This is the vehicle heartbeat. |
| `publisherOnline` | `true` when a video frame arrived in the last minute |
| `status` | `active` or `ended` |
| `startedAt` / `endedAt` | epoch ms, or `null` |
| `score` | integer. Starts at 98. SOS drops it by 20 (floor 8). High or critical alerts drop it by 8 (floor 46). |

Seat `id`: `driver`, `front`, `rear-left`, `rear-right`.

`GET /v1/rides/{rideId}/cabin` returns only:

```json
{ "driverState": "attentive", "seats": [], "safetyStatus": "safe" }
```

---

## History

`GET /v1/history?deviceId=orin-nano-01`

Newest `startedAt` first. Omit `deviceId` to list every ride.

```json
{
  "rides": [
    {
      "id": "ride-1842",
      "deviceId": "orin-nano-01",
      "passenger": "Meera Shah",
      "status": "active",
      "startedAt": 1761560000000,
      "endedAt": null,
      "safetyStatus": "safe",
      "score": 98,
      "alertCount": 2
    }
  ]
}
```

Open one trip with `GET /v1/rides/{id}` and `GET /v1/rides/{id}/alerts`. This list does not record each time the device came online. Use `deviceState` on the current ride for that.

---

## Alerts

`GET /v1/rides/{rideId}/alerts?status=all&channel=dms`

`status`: `all` (default), `open`, `emergency` (`high` or `critical`), `caution` (`info`, `low`, `medium`). Unknown `status` returns every alert.

`channel`: `dms` (driver) or `cms` (cabin). Omit it for both.

```json
{
  "alerts": [
    {
      "id": "alert-1",
      "tripId": "ride-1842",
      "kind": "distraction",
      "orinType": "DISTRACTION",
      "channel": "dms",
      "severity": "high",
      "title": "Driver distraction",
      "detail": "head turned",
      "at": 1761560000000,
      "locationLabel": "head_turned",
      "coordinate": { "latitude": null, "longitude": null },
      "acknowledged": false,
      "evidenceId": null,
      "origin": "vehicle",
      "confidence": 0.9,
      "clipId": "clip-abc123"
    }
  ]
}
```

| Field | Values |
|---|---|
| `kind` | `distraction`, `drowsiness`, `sos`, `seat_occupancy`, `suspicious_activity`, `harsh_braking`, `route_deviation` |
| `channel` | `dms` or `cms` |
| `severity` | `info`, `low`, `medium`, `high`, `critical` |
| `origin` | `vehicle` or `device` (phone SOS) |
| `clipId` | clip to play, or `null` when this alert has no video |

`POST /v1/alerts/{alertId}/ack` with no body. Returns the same alert with `acknowledged: true`. `404` if missing.

---

## VLM analysis

Not an alert. Latest description only. DMS is the driver scene. CMS is the cabin scene.

`GET /v1/rides/{rideId}/analysis`

`GET /v1/rides/{rideId}/analysis?channel=dms`

`GET /v1/rides/{rideId}/analysis?channel=cms`

```json
{
  "deviceId": "orin-nano-01",
  "updatedAt": 1761560000000,
  "dms": {
    "scene": "Driver facing forward, both hands on the wheel.",
    "hazards": [],
    "confidence": 0.82,
    "suppressed": [],
    "observations": {
      "handsOnWheel": true,
      "gaze": "forward",
      "viewBlocked": false,
      "lighting": "ok",
      "cameraBlocked": false
    },
    "at": 1761560000000
  },
  "cms": {
    "scene": "Adult in front. Child in rear-left.",
    "hazards": [],
    "confidence": 0.74,
    "suppressed": [],
    "observations": {
      "occupants": { "adults": 2, "children": 1 },
      "childUnattended": false,
      "aggression": "calm",
      "viewBlocked": false,
      "weaponOrSmoke": false
    },
    "at": 1761560000000
  }
}
```

A side that has not arrived yet is `null`. `aggression` is `calm`, `argument`, or `panic`. Show `dms` on the driver page and `cms` on the cabin page. Driver alerts still come from the detector (`kind` `distraction` / `drowsiness`), not from `dms.hazards`.

---

## Live stills

One current JPEG per channel, with the capture time.

`GET /v1/rides/{rideId}/frames/live?channel=dms`

`GET /v1/rides/{rideId}/frames/live?channel=cms`

```json
{
  "rideId": "ride-1842",
  "channel": "dms",
  "at": 1761561800500,
  "url": "/v1/rides/ride-1842/frames/live/image?channel=dms"
}
```

Load the picture from `{BASE}` + `url`. `404` until the first frame. `403` when sharing is off. If `at` is more than about 15 seconds old, show the still as stale.

`dms` is the driver camera. `cms` is the cabin camera.

---

## Live video

The Jetson is already publishing into LiveKit. The app does not call the car. It asks this API for a watch token.

`GET /v1/rides/{rideId}/video?track=all`

`track` may be `all` (default), `driver`, or `cabin`.

```json
{
  "url": "ws://YOUR_VPS_IP:7880",
  "mode": "livekit",
  "token": "<viewer jwt>",
  "room": "ride-1842",
  "tracks": ["driver", "cabin"],
  "expiresAt": 1761560900000,
  "publisherOnline": true,
  "preview": "/v1/rides/ride-1842/video/preview"
}
```

| `mode` | What to do |
|---|---|
| `livekit` | Connect a LiveKit client to `url` with `token`. Subscribe to tracks `driver` and `cabin`. The token cannot publish. Refresh by calling `GET /video` again before `expiresAt`. |
| `dummy` | There is no moving stream. Show the JPEG from `{BASE}{preview}?track=driver` or `track=cabin`. |

`403` when sharing is off. `publisherOnline: false` means the vehicle has not sent video recently. Show "vehicle camera offline" instead of a black room.

This is watch, not a phone call. There is no answer or reject request.

`GET /v1/rides/{rideId}/video/preview?track=driver` returns a JPEG body (`track` is `driver` or `cabin` on this route). Prefer `frames/live` for stills. Prefer LiveKit when `mode` is `livekit`.

---

## Alert clip

Only a few seconds around a danger alert are stored. The full trip is not a video.

When `alert.clipId` is set:

`GET /v1/rides/{rideId}/clips/{clipId}`

```json
{
  "id": "clip-abc123",
  "rideId": "ride-1842",
  "alertId": "alert-1",
  "channel": "dms",
  "startAt": 1761561196000,
  "endAt": 1761561204000,
  "frames": [
    { "at": 1761561196000, "url": "/v1/media/clip-abc123/0.jpg" },
    { "at": 1761561200000, "url": "/v1/media/clip-abc123/1.jpg" }
  ],
  "videoUrl": null
}
```

Show the frames in `at` order. Image URL is `{BASE}` + `frames[i].url`. `channel` `dms` is the driver clip. `cms` is the cabin clip. `videoUrl` is `null` until a single MP4 is stored. `403` when sharing is off. `404` when that clip is not on this ride.

---

## WebSocket

`ws://YOUR_VPS_IP:8000/v1/rides/{rideId}/live`

Replace `http` with `ws`. The server ignores text you send. Close the socket to leave.

| `type` | Payload |
|---|---|
| `telemetry` | `{ "type": "telemetry", "ride": Ride }` |
| `status` | `{ "type": "status", "ride": Ride }` |
| `alert` | `{ "type": "alert", "alert": Alert, "ride": Ride }` |
| `sos` | `{ "type": "sos", "alert": Alert, "ride": Ride, "notified"?: string[] }` |
| `analysis` | `{ "type": "analysis", "channel": "dms" or "cms", "analysis": { scene, hazards, confidence, suppressed, observations, at } }` |

On `telemetry` and `status`, replace the ride in local state. On `alert` and `sos`, replace the ride and prepend the alert. On `analysis`, replace only that channel's scene.

```js
const ws = new WebSocket(`${base.replace(/^http/, "ws")}/v1/rides/${rideId}/live`);
ws.onmessage = (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.type === "telemetry" || msg.type === "status") setRide(msg.ride);
  else if (msg.type === "alert" || msg.type === "sos") {
    setRide(msg.ride);
    prependAlert(msg.alert);
  } else if (msg.type === "analysis") setAnalysis(msg.channel, msg.analysis);
};
```

---

## SOS

`POST /v1/rides/{rideId}/sos`

```json
{
  "passenger": "Meera Shah",
  "latitude": 12.9716,
  "longitude": 77.5946,
  "source": "phone"
}
```

All fields are optional.

```json
{
  "id": "sos-a1b2c3d4e5f6",
  "at": 1761560000000,
  "topic": "ride/ride-1842/sos",
  "origin": "device",
  "note": "Notified Priya Shah",
  "alert": {}
}
```

`note` is `"Notified nobody sharing"` when no guardian has sharing on. `alert` is an Alert. This also pushes a `sos` event on the live socket.

---

## Telemetry

`POST /v1/rides/{rideId}/telemetry`

`latitude` and `longitude` are required. The other fields are optional and only overwrite the stored value when sent. CamelCase or snake_case is accepted for the optional names.

```json
{
  "latitude": 12.9716,
  "longitude": 77.5946,
  "heading": 90,
  "speedKmh": 34.5,
  "etaMin": 12
}
```

Response is a Ride. Also pushes `telemetry` on the live socket.

---

## Guardians

`GET /v1/rides/{rideId}/guardians`

```json
{
  "guardians": [
    {
      "id": "g-priya",
      "name": "Priya Shah",
      "relationship": "Mother",
      "phone": "+91 98450 11008",
      "sharing": true,
      "lastNotifiedAt": null
    }
  ]
}
```

`lastNotifiedAt` is `null` until that guardian is included in an SOS. An unknown ride returns an empty list, not `404`.

`POST /v1/rides/{rideId}/guardians`

```json
{ "name": "Anita Shah", "relationship": "mother", "phone": "+9198...", "sharing": true }
```

`name` is required. Response: `{ "id": "g-1a2b3c4d" }`. `404` if the ride does not exist.

`POST /v1/rides/{rideId}/guardians/{guardianId}/sharing`

No body. Flips `sharing`. Response: `{ "id": "g-priya", "sharing": false }`. `404` if that guardian is not on this ride.

You cannot edit the name or phone, and you cannot delete a guardian.

---

## Share and notices

`POST /v1/rides/{rideId}/share` with no body.

```json
{ "link": "vms://trip/ride-1842", "origin": "vehicle" }
```

`GET /v1/rides/{rideId}/notices`

```json
{
  "notices": [
    {
      "id": "notice-abc123",
      "at": 1761560000000,
      "title": "Trip link refreshed",
      "body": "vms://trip/ride-1842",
      "guardianNames": ["Priya Shah"],
      "origin": "device"
    }
  ]
}
```

---

## Push token

`POST /v1/devices/{guardianId}/push-token`

`guardianId` must be an existing guardian id (`g-…`), not the Jetson device id. `404` otherwise.

```json
{ "token": "<fcm token>", "ride_id": "ride-1842" }
```

`ride_id` is accepted and ignored. Response: `{ "ok": true }`. The token is stored. Push delivery is not implemented yet.

---

## Health

`GET /health`

```json
{
  "ok": true,
  "mqtt": { "host": "emqx", "connected": true, "error": "" },
  "ride": "ride-1842",
  "livekit": { "url": "ws://YOUR_VPS_IP:7880", "configured": true, "mode": "livekit" }
}
```

Use this to confirm the API is up. The app does not need to poll it.

---

## Do not call from the app

These are for the Jetson. They require `MEDIA_DEVICE_KEY`, which the phone must not have.

- `POST /v1/devices/{deviceId}/media-token`
- `POST /v1/devices/{deviceId}/video/frame`
- `POST /v1/devices/{deviceId}/clips`
