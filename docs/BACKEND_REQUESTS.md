# Backend requirements — perfect guardian app

**Share with backend.**  
Contract: [`FRONTEND.md`](./FRONTEND.md) (source of truth)  
App: `http://51.81.81.118:8000` · Ride: `ride-1842` · Device: `orin-nano-01`  
Updated: **2026-10-30**

---

## Already integrated on the phone

| Area | Status |
|---|---|
| Ride + live WebSocket | Done |
| Telemetry POST | Done |
| Alerts list + ack + SOS | Done |
| Analysis DMS/CMS | Done |
| Live stills `frames/live` | Done |
| Watch start/stop (`GET /video`, `POST /video/cancel`) | Done |
| History list + open by `startedAt` + `route` map | Done (client ready) |
| Cabin seats | Done |
| Guardians / share / notices | Done |
| Snap still → gallery | Done (client-side) |
| Clip evidence UI | Ready when `clipId` is set |

---

## P0 — Must fix for a usable product

### 1. History trips (same ride id, many trips)

Per FRONTEND.md: every history row can share `id: "ride-1842"`. Trip key is **`startedAt`**.

| Need | Detail |
|---|---|
| List | `GET /v1/history?deviceId=orin-nano-01` returns **multiple rows** with real `startedAt` / `endedAt`, `start` / `end` pins, `alertCount`, `status` |
| Open map | `GET /v1/rides/ride-1842?startedAt={ms}` returns Ride + **`route`** (≤200 points). Unknown `startedAt` → `200` + `route: []` (not 404) |
| Live open | `GET /v1/rides/ride-1842` (no query) = newest trip that has GPS |

**Acceptance:** Past rides shows more than one trip when the car has run multiple times; opening a row draws the polyline.

### 2. Alert clips — **working on VPS (verified 2026-10-30)**

Live check on `ride-1842`: **37 / 112** alerts have `clipId`. Example:

- `GET /v1/rides/ride-1842/clips/clip-d648bbcabe` → `videoUrl: /v1/media/clip-d648bbcabe/clip.mp4` + 15 frames  
- MP4 `GET` → `200 video/mp4` (~77 KB)  
- Frame `0.jpg` → `200 image/jpeg`  
- Sharing off still returns **403** (keep that rule)

**Remaining:** keep populating `clipId` on new danger alerts; ensure every high/critical event gets an ~8s MP4 when encode succeeds.

### 3. Device online + live map

| Need | Detail |
|---|---|
| Heartbeat | `deviceState: "online"` while Orin is up |
| Telemetry | Real `position`, `heading`, `speedKmh`, `etaMin` (prefer `null` over fake `0`) |
| Socket | `telemetry` / `status` keep ride fresh |

**Acceptance:** Live map moves; status is not stuck “Device offline” when car is up.

### 4. Fresh stills + publisherOnline

| Need | Detail |
|---|---|
| `frames/live` `at` | Within ~15s while cameras run |
| `publisherOnline` | `true` if a frame arrived in the last minute |
| After cancel | Stills keep updating after `POST /video/cancel` |

---

## P0 — New APIs for Cabin media (product asks)

FRONTEND.md Watch token is **viewer-only**. Perfect Cabin needs:

| Control | App today | Backend to add |
|---|---|---|
| **Record** | Starts/stops Watch publish | Optional: cloud DVR `POST/GET /v1/rides/{id}/recordings` with downloadable MP4 for gallery |
| **Listen** | Starts Watch | Confirm LiveKit **audio** track named `cabin` while publish is on |
| **Snap** | Saves `frames/live` JPEG | Optional: persist `POST /snapshots` |
| **Speak** | Blocked | **Required:** talk token |

### Speak contract (required)

`POST /v1/rides/{rideId}/video/talk`

```json
{
  "url": "wss://HOST:7880",
  "token": "<jwt canPublish audio only>",
  "room": "ride-1842",
  "expiresAt": 1761560900000,
  "tracks": ["guardian-mic"]
}
```

- Car subscribes to `guardian-mic` and plays on cabin speaker  
- `POST /v1/rides/{rideId}/video/talk/cancel` ends talk  

**Acceptance:** guardian holds Speak → cabin hears phone mic within ~1s.

---

## P1 — Polish

1. History `startedAt` always set when a trip becomes active; `endedAt` on end.  
2. `alertCount` matches alerts for that trip window (even if alert list API is still unfiltered by `startedAt`).  
3. Alert `coordinate` filled when GPS known (pins on history map).  
4. Push delivery for SOS / high alerts (`push-token` already stores).  
5. Optional: filter `GET /alerts?startedAt=` so history trip only shows that trip’s events.

---

## P2 — Native app (frontend, not API)

| Item | Why |
|---|---|
| LiveKit React Native client | Moving Watch video + Listen audio (Expo Go cannot) |
| Dev / production build | Required for LiveKit + reliable gallery permissions |

---

## Do not expose to the phone

- `MEDIA_DEVICE_KEY`, LiveKit API secret, MQTT password  
- Jetson-only routes under `/v1/devices/{deviceId}/…` media upload  

---

## Priority order

1. History multi-trip + `?startedAt=` + `route`  
2. `clipId` + MP4 evidence  
3. Device online + real telemetry  
4. Speak talk token + cabin speaker  
5. Cabin LiveKit audio for Listen  
6. Optional recordings API  
7. Push delivery  

Phone client is aligned to current FRONTEND.md (including history-by-`startedAt`). Items above are what backend (and native LiveKit) still need for a perfect app.
