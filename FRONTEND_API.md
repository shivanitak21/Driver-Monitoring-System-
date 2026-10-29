# VMS guardian API

HTTP and WebSocket contract for the phone app. The vehicle talks MQTT to this service. The app talks only to this API.

**Base URL (demo):** `http://51.81.81.118:8000`  
Swagger: `http://51.81.81.118:8000/docs` · OpenAPI: `/openapi.json` · Health: `/health`

Set `EXPO_PUBLIC_TELEMETRY_URL` to that origin (app default). Leave `EXPO_PUBLIC_MQTT_URL` empty.

Demo ride id: `ride-1842` · Device id: `orin-nano-01`

OpenAPI UI (same host): `/docs`

There is no auth header today. CORS allows any origin.

Default ride id while a real trip id is not wired: `ride-1842`.

Times named `at` and `lastNotifiedAt` are Unix epoch **milliseconds**. `updatedAt` is an ISO-8601 string.

---

## Types

### Ride

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
  "updatedAt": "2026-10-27T10:15:00+00:00"
}
```

| Field | Values |
|---|---|
| `safetyStatus` | `safe` (default), `caution` (high or critical alert), `emergency` (SOS) |
| `driverState` | `attentive` (default), `drowsy`, `distracted`, `unavailable` (no face) |
| `deviceState` | vehicle status string, often `online` or `offline` |
| `position.latitude` / `longitude` | number or `null` |
| `etaMin`, `speedKmh`, `heading` | number or `null` |
| `score` | integer, starts at 98. SOS drops it by 20 (floor 8). High/critical alerts drop it by 8 (floor 46). |

Seat `id`: `driver` \| `front` \| `rear-left` \| `rear-right`.

### Alert

```json
{
  "id": "sos-a1b2c3d4e5f6",
  "tripId": "ride-1842",
  "kind": "sos",
  "severity": "critical",
  "title": "SOS raised",
  "detail": "Meera Shah raised SOS.",
  "at": 1761560000000,
  "locationLabel": "",
  "coordinate": { "latitude": 12.9716, "longitude": 77.5946 },
  "acknowledged": false,
  "evidenceId": null,
  "origin": "device"
}
```

| Field | Values |
|---|---|
| `kind` | `distraction`, `drowsiness`, `sos`, `seat_occupancy`, `suspicious_activity`, `harsh_braking`, `route_deviation` |
| `severity` | `info`, `low`, `medium`, `high`, `critical`. SOS is always `critical`. Seat occupancy is `info`. |
| `origin` | `device` (phone SOS) or `vehicle` (cabin / driver alerts) |
| `evidenceId` | string or `null` |

Default titles: Driver distraction, Driver drowsiness, SOS raised, Seat occupancy, Suspicious activity, Harsh braking, Route deviation.

### Guardian

```json
{
  "id": "g-1a2b3c4d",
  "name": "Anita Shah",
  "relationship": "mother",
  "phone": "+9198...",
  "sharing": true,
  "lastNotifiedAt": 1761560000000
}
```

`lastNotifiedAt` is `null` until that guardian is included in an SOS.

### Notice

```json
{
  "id": "notice-abc123",
  "at": 1761560000000,
  "title": "SOS sent",
  "body": "Notified Anita Shah.",
  "guardianNames": ["Anita Shah"],
  "origin": "device"
}
```

---

## REST

Errors are FastAPI shape: `{ "detail": "ride not found" }` with status `404`.

### `GET /health`

Liveness. Use this to confirm the API is up and the broker link is live.

```json
{
  "ok": true,
  "mqtt": { "host": "10.0.0.5", "connected": true, "error": "" },
  "ride": "ride-1842"
}
```

### `GET /v1/rides/{rideId}`

Current trip snapshot. `404` if the ride does not exist.

Response: **Ride**.

### `GET /v1/rides/{rideId}/alerts?status=all`

Newest first.

| `status` | Filter |
|---|---|
| `all` (default) | every alert |
| `open` | `acknowledged === false` |
| `emergency` | `severity` is `high` or `critical` |
| `caution` | `severity` is `info`, `low`, or `medium` |

```json
{ "alerts": [ /* Alert */ ] }
```

Unknown `status` values return the full list (same as `all`).

### `POST /v1/alerts/{alertId}/ack`

Marks one alert acknowledged. No body. `404` if missing.

Response: **Alert** with `acknowledged: true`.

### `POST /v1/rides/{rideId}/sos`

Passenger SOS from the phone. Creates a critical alert, sets `safetyStatus` to `emergency`, notifies guardians with `sharing: true`, writes a notice, and pushes a `sos` event on the live socket.

If the ride id is unknown, the server attaches the SOS to the default ride.

```json
{
  "passenger": "Meera Shah",
  "latitude": 12.9716,
  "longitude": 77.5946,
  "source": "phone"
}
```

All fields are optional. `passenger` defaults to `""`. Coordinates may be `null`.

```json
{
  "id": "sos-a1b2c3d4e5f6",
  "at": 1761560000000,
  "topic": "ride/ride-1842/sos",
  "origin": "device",
  "note": "Notified Anita Shah",
  "alert": { }
}
```

`note` is `"Notified nobody sharing"` when no guardian has sharing on. `alert` is an **Alert**.

### `POST /v1/rides/{rideId}/telemetry`

Phone location for the map. `404` if the ride does not exist. Pushes a `telemetry` event on the live socket.

JSON accepts camelCase or snake_case for the optional fields.

```json
{
  "latitude": 12.9716,
  "longitude": 77.5946,
  "heading": 90,
  "speedKmh": 34.5,
  "etaMin": 12
}
```

`latitude` and `longitude` are required. The others are optional and only overwrite the stored value when sent.

Response: **Ride**.

### `GET /v1/rides/{rideId}/cabin`

Driver and seat slice of the ride. `404` if missing.

```json
{
  "driverState": "attentive",
  "seats": [ { "id": "driver", "label": "Driver", "occupied": true } ],
  "safetyStatus": "safe"
}
```

### `GET /v1/rides/{rideId}/guardians`

```json
{ "guardians": [ /* Guardian */ ] }
```

Empty array when none are stored. Does not 404 for an unknown ride.

### `POST /v1/rides/{rideId}/guardians`

`404` if the ride does not exist.

```json
{
  "name": "Anita Shah",
  "relationship": "mother",
  "phone": "+9198...",
  "sharing": true
}
```

`name` is required. `relationship` and `phone` default to `""`. `sharing` defaults to `true`.

```json
{ "id": "g-1a2b3c4d" }
```

### `POST /v1/rides/{rideId}/guardians/{guardianId}/sharing`

Toggles `sharing`. No body. `404` if that guardian is not on this ride.

```json
{ "id": "g-1a2b3c4d", "sharing": false }
```

### `POST /v1/rides/{rideId}/share`

Refreshes the trip link and writes a notice titled `"Trip link refreshed"`. `404` if the ride does not exist. No body.

```json
{ "link": "vms://trip/ride-1842", "origin": "vehicle" }
```

### `GET /v1/rides/{rideId}/notices`

Newest first.

```json
{ "notices": [ /* Notice */ ] }
```

### `POST /v1/devices/{deviceId}/push-token`

`deviceId` must be an existing **guardian id** (`g-…`). `404` otherwise (`detail`: `"store the token against a guardian id for now"`).

```json
{ "token": "<fcm token>", "ride_id": "ride-1842" }
```

`ride_id` is accepted and ignored. The token is stored on the guardian row.

```json
{ "ok": true }
```

Push delivery is not implemented yet. This only stores the token.

---

## WebSocket

`GET ws(s)://<host>/v1/rides/{rideId}/live`

Connect and keep the socket open. The server accepts the connection and then ignores any text the client sends. Close the socket to leave the room.

Server frames are JSON text:

| `type` | When | Payload |
|---|---|---|
| `telemetry` | `POST .../telemetry` | `{ "type": "telemetry", "ride": Ride }` |
| `status` | vehicle heartbeat / cabin status | `{ "type": "status", "ride": Ride }` |
| `alert` | vehicle alert | `{ "type": "alert", "alert": Alert, "ride": Ride }` |
| `sos` | phone SOS, or a vehicle alert whose kind is `sos` | `{ "type": "sos", "alert": Alert, "ride": Ride, "notified"?: string[] }` |

`notified` is present only for phone SOS. It is the list of guardian names who had sharing on. A vehicle SOS is sent twice: once as `alert`, then again as `sos` (without `notified`).

Replace the ride object in local state on `telemetry` and `status`. Append the alert on `alert` and `sos`, and set safety from `ride.safetyStatus`.

Example:

```js
const ws = new WebSocket(
  `${base.replace(/^http/, "ws")}/v1/rides/${rideId}/live`
);
ws.onmessage = (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.type === "telemetry" || msg.type === "status") {
    setRide(msg.ride);
  } else if (msg.type === "alert" || msg.type === "sos") {
    setRide(msg.ride);
    prependAlert(msg.alert);
  }
};
```

---

## Suggested screens

| Screen | Calls |
|---|---|
| Trip home | `GET /v1/rides/{id}` once, then the live socket |
| Map | `POST /v1/rides/{id}/telemetry` on location updates |
| Alerts | `GET /v1/rides/{id}/alerts`, then socket `alert` / `sos`. Ack with `POST /v1/alerts/{id}/ack` |
| SOS button | `POST /v1/rides/{id}/sos` |
| Cabin | `GET /v1/rides/{id}/cabin` or `ride.seats` + `ride.driverState` from the socket |
| Guardians | list, `POST` to add, `POST .../sharing` to toggle |
| Share | `POST /v1/rides/{id}/share`, then `GET .../notices` |
| Push | `POST /v1/devices/{guardianId}/push-token` after the guardian exists |

---

## Smoke test

```bash
curl -s https://<host>/health

curl -s -X POST https://<host>/v1/rides/ride-1842/sos \
  -H 'content-type: application/json' \
  -d '{"passenger":"Meera Shah","latitude":12.9716,"longitude":77.5946,"source":"phone"}'

curl -s https://<host>/v1/rides/ride-1842
curl -s https://<host>/v1/rides/ride-1842/alerts
```
