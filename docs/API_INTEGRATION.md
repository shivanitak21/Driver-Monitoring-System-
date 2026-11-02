# API integration checklist

Source of truth: [`FRONTEND.md`](./FRONTEND.md).  
Base: `EXPO_PUBLIC_TELEMETRY_URL` (default `http://51.81.81.118:8000`). No auth header. The phone does not call MQTT or Jetson upload routes.

| Endpoint | Status | UI | Notes |
|---|---|---|---|
| `GET /health` | Integrated | Boot via `bootstrapLive` | Called once. Not polled. |
| `GET /v1/rides/{rideId}` | Integrated | Live map, trip open | Live open omits `startedAt`. History open passes `startedAt`. |
| `WS /v1/rides/{rideId}/live` | Integrated | `RideRuntime` | `telemetry` / `status` replace the ride. `alert` / `sos` prepend. `analysis` replaces that channel. |
| `POST /v1/rides/{rideId}/telemetry` | Client ready, not sent from the phone GPS | — | Sending the guardian's phone fix was moving the car marker. The marker now stays on the ride `position` from the API. |
| `GET /v1/rides/{rideId}/alerts` | Integrated | Alerts, Live alert sheet | Live list shows an alert only when `clipId` is a non-empty id. The tab refreshes every 20s so a clip that arrives later can appear. |
| `POST /v1/alerts/{alertId}/ack` | Integrated | Alerts | No body. |
| `GET /v1/rides/{rideId}/analysis` | Integrated | Cabin | DMS and CMS. Socket `analysis` updates one channel. This API does not take a frame or a JSON body. The car publishes the reading. |
| `GET /v1/rides/{rideId}/frames/live` | Integrated | Cabin stills | `dms` and `cms`. Image is `{BASE}` + `url`. Marked stale after 15s. |
| `GET /v1/rides/{rideId}/video?track=all` | Integrated | Cabin Watch | Starts both `driver` and `cabin` video plus `cabin` audio. Called only when Watch starts, and again 60s before `expiresAt`. |
| `POST /v1/rides/{rideId}/video/cancel` | Integrated | Stop Watch | Does not stop Speak. |
| `POST /v1/rides/{rideId}/video/talk` | Integrated | Speak | Publishes `guardian-mic`. Does not subscribe. |
| `POST /v1/rides/{rideId}/video/talk/cancel` | Integrated | End Speak | |
| `GET /v1/history?deviceId=` | Integrated | Trips | Rows keyed by `startedAt`, not by ride id alone. |
| `GET /v1/rides/{rideId}/clips/{clipId}` | Integrated | Evidence | Opened from an alert that has `clipId`. Plays `videoUrl` when the API sends one. |
| `POST /v1/rides/{rideId}/recordings` | Integrated | Cabin Record | Car records cabin video and mic. The phone no longer saves a WebView file as the recording. |
| `POST .../recordings/{id}/cancel` | Integrated | Stop Record | UI shows Uploading while `status` is `stopping`. The phone checks for up to about 3 minutes. |
| `GET .../recordings?guardianId=` | Integrated | Cabin library | |
| `POST /v1/rides/{rideId}/snapshots` | Integrated | Cabin Snap | Body is `{ guardianId, channel }`. Channel is the camera the user selected: Driver or Cabin. Split view does not snap both. |
| `GET .../snapshots?guardianId=` | Integrated | Cabin library | |
| `POST /v1/rides/{rideId}/sos` | Integrated | SOS | Optional passenger and phone coordinates, `source: "phone"`. |
| `GET /v1/rides/{rideId}/cabin` | Integrated | Cabin seats | |
| `GET/POST /v1/rides/{rideId}/guardians` | Integrated | Family | No edit or delete. The API has neither. |
| `POST .../guardians/{id}/sharing` | Integrated | Family | |
| `POST /v1/rides/{rideId}/share` | Integrated | Family | |
| `GET /v1/rides/{rideId}/notices` | Integrated | Family | |
| `POST /v1/devices/{guardianId}/push-token` | Client only | — | **Blocker.** The function exists. Nothing requests a push token. `expo-notifications` is not installed. High and critical alerts stay on the WebSocket. |

## Blockers that are not missing app routes

1. **Snapshot is not a grab of the LiveKit picture.** `POST /snapshots` tells the server to copy its latest JPEG for that channel. While Watch is on, the car pauses JPEG uploads, so the saved snap can be the last still from before Watch. There is no phone API to upload a LiveKit frame.
2. **VLM is not a request the phone sends.** `GET /analysis` and the `analysis` socket event are the whole contract. The phone cannot post a camera frame, clip, or prompt to the model.
3. **Both live pictures require the car to publish tracks named `driver` and `cabin`.** The player subscribes to those names and to cabin audio. A missing track stays on Waiting. `publisherOnline` is not treated as "stream dead" during Watch, because JPEG uploads pause on purpose.
4. **Push** is blocked as in the table above.
5. **A long recording stays on Uploading** until the car finishes the MP4. The phone does not upload that file. After about 3 minutes it stops asking; opening Cabin loads the list again.
