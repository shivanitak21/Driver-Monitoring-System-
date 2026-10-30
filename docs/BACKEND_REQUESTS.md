# Backend requests (share with backend)

App base: `http://51.81.81.118:8000` · Ride: `ride-1842` · Device: `orin-nano-01`  
Contract: `docs/FRONTEND.md` · Updated: **2026-10-30**

---

## Short list — what we need

1. **Alert clips** — Set `alerts[].clipId` on danger events and serve `GET /clips/{clipId}` with MP4 `videoUrl` + frame stills. Many alerts still have `clipId: null`.

2. **Device online + real map data** — Keep `deviceState: "online"` while Orin is up. Send real `position`, `heading`, `speedKmh`, `etaMin` (use `null` when unknown, not `0`).

3. **Speak / talkback (blocked today)** — Watch token is **viewer-only**. Need e.g. `POST /v1/rides/{rideId}/video/talk` returning a LiveKit token that can **publish audio only**, and the car must play that track on the cabin speaker. Also `…/talk/cancel`.

4. **Listen** — Confirm LiveKit publishes cabin **audio** track named `cabin` when Watch is on (`GET /video`). Phone will subscribe (native LiveKit client).

5. **Record to file (optional product)** — If “Record” means save stream to gallery/cloud (not only start Watch), add:
   - `POST /v1/rides/{rideId}/recordings` start/stop  
   - `GET /v1/rides/{rideId}/recordings` → downloadable `videoUrl`  
   Today `GET /video` only starts publish; phone Snap already saves still JPEGs to the gallery.

6. **Fresh stills** — Keep `frames/live` `at` within ~15s while cameras run; `publisherOnline` when a frame arrived in the last minute. Stills must work after `POST /video/cancel`.

7. **History** — Populate `startedAt` / `endedAt` on rides in `GET /v1/history`.

8. **Push (later)** — `POST /v1/devices/{guardianId}/push-token` stores tokens; delivery for SOS / high alerts not implemented yet.

---

## Already working on the phone (no backend change)

Ride + live socket · alerts/ack · SOS · analysis · frames/live stills · Watch start/stop (`GET /video`, `POST /video/cancel`) · cabin seats · guardians/share/notices · Snap from live still JPEG

---

## UI mapping

| Phone control (Cabin tab) | Uses today | Backend gap |
|---|---|---|
| **Record / Stop** | `GET /video` / `POST /video/cancel` | Optional cloud recording API + native LiveKit for MP4 gallery |
| **Listen** | Same Watch session | Cabin audio track + native LiveKit |
| **Snap** | `frames/live` → Photos | Optional stored snapshot API |
| **Speak** | UI only | **Talk token + cabin speaker** |

Home (Live map) no longer has Video / Audio / Speak — map + SOS + Cabin shortcut only.
