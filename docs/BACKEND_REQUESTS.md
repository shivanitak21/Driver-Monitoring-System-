# Backend requirements — perfect guardian app

**Share with backend.**  
Contract: [`FRONTEND.md`](./FRONTEND.md) (source of truth)  
App: `http://51.81.81.118:8000` · Ride: `ride-1842` · Device: `orin-nano-01`  
Updated: **2026-10-30** (re-verified Snap / Record / Speak live)

---

## Already integrated on the phone

| Area | Status |
|---|---|
| Ride + live WebSocket | Done |
| Telemetry POST | Done |
| Alerts list + ack + SOS (+ `?startedAt=` for past trips) | Done |
| Analysis DMS/CMS | Done |
| Live stills `frames/live` | Done |
| Watch start/stop (`GET /video`, `POST /video/cancel`) | Done |
| Watch LiveKit player (cabin video + cabin audio) | Done (WebView) |
| Speak (`POST /video/talk`, `…/talk/cancel`, publish `guardian-mic`) | **Live on VPS · client wired** |
| Record (`POST /recordings`, cancel, list by `guardianId`) | **Live on VPS · client wired** |
| Snap (`POST /snapshots`, list by `guardianId`) | **Live on VPS · client wired** |
| History list + open by `startedAt` + `route` map | Done (client ready) |
| Cabin seats | Done |
| Guardians / share / notices | Done |
| Clip evidence UI | Ready when `clipId` is set |

---

## Verified live (2026-10-30)

| Call | Result |
|---|---|
| `POST /snapshots` `{guardianId, channel}` | 200 + `url` under `/v1/media/snapshots/…` |
| `GET /snapshots?guardianId=` | 200 `{ snapshots: [...] }` |
| `POST /recordings` `{action:"start", guardianId}` | 200 `status: recording` |
| `POST /recordings/{id}/cancel` | 200 `status: stopping` |
| `GET /recordings?guardianId=` | 200 `{ recordings: [...] }` |
| `POST /video/talk` | 200 `{ url, token, room, tracks:["guardian-mic"] }` |
| `POST /video/talk/cancel` | 200 `{ ok, talk:false }` |

Phone uses first **sharing** guardian id (falls back to first guardian), e.g. `g-priya`.

---

## P0 — Still needed for a usable product

1. **Orin online** — `deviceState: online`, `publisherOnline: true`, fresh `frames/live`  
2. **Watch** — Jetson publishes LiveKit tracks named `cabin` (video + audio) while Watch is on  
3. **Record → ready** — after cancel, upload MP4 so `status: ready` and `videoUrl` is set  
4. **Speak path** — cabin speaker plays `guardian-mic` when guardian is talking  

---

## Do not expose to the phone

- `MEDIA_DEVICE_KEY`, LiveKit API secret, MQTT password  
- Jetson-only routes under `/v1/devices/{deviceId}/…` media upload  
