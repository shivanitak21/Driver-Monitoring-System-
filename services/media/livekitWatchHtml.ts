/**
 * Minimal LiveKit viewer HTML for WebView.
 * Subscribes to remote tracks named "cabin" (video + audio) per FRONTEND.md.
 */
export function buildLiveKitWatchHtml(options: {
  url: string;
  token: string;
  /** When false, cabin audio stays muted (Watch without Listen). */
  listen: boolean;
}) {
  const url = JSON.stringify(options.url);
  const token = JSON.stringify(options.token);
  const listen = options.listen ? "true" : "false";

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <style>
    html, body { margin: 0; padding: 0; width: 100%; height: 100%; background: #0a0a0a; overflow: hidden; font-family: -apple-system, system-ui, sans-serif; }
    #stage { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; }
    video { width: 100%; height: 100%; object-fit: contain; background: #000; }
    #tap {
      display: none; position: absolute; inset: 0; align-items: center; justify-content: center;
      background: rgba(0,0,0,0.45); color: #fff; font-size: 15px; font-weight: 600;
    }
    #status {
      position: absolute; left: 10px; right: 10px; bottom: 10px;
      padding: 8px 10px; border-radius: 10px;
      background: rgba(0,0,0,0.55); color: #f5f5f7; font-size: 12px; line-height: 1.35;
      pointer-events: none;
    }
  </style>
</head>
<body>
  <div id="stage"><video id="video" playsinline webkit-playsinline autoplay muted></video></div>
  <div id="tap">Tap to enable cabin audio</div>
  <div id="status">Connecting…</div>
  <script src="https://cdn.jsdelivr.net/npm/livekit-client@2.9.1/dist/livekit-client.umd.min.js"></script>
  <script>
    (function () {
      var statusEl = document.getElementById("status");
      var videoEl = document.getElementById("video");
      var tapEl = document.getElementById("tap");
      var listen = ${listen};
      var room = null;
      var audioEl = null;
      var pendingAudioTrack = null;
      var hasVideo = false;
      var hasAudio = false;

      function post(payload) {
        try {
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify(payload));
          }
        } catch (e) {}
      }

      function setStatus(msg) {
        statusEl.textContent = msg;
        post({ type: "status", message: msg });
      }

      function cabinName(pub, track) {
        var name = "";
        if (pub) name = pub.trackName || pub.name || "";
        if (!name && track) name = track.name || "";
        return String(name || "").toLowerCase();
      }

      function isCabin(pub, track) {
        return cabinName(pub, track) === "cabin";
      }

      function kindOf(pub, track) {
        if (pub && pub.kind) return pub.kind;
        if (track && track.kind) return track.kind;
        return "";
      }

      function attachVideo(track) {
        try {
          track.attach(videoEl);
          videoEl.muted = true;
          videoEl.playsInline = true;
          videoEl.play().catch(function () {});
          hasVideo = true;
          updateStatus();
        } catch (e) {
          setStatus("Video attach failed");
        }
      }

      function ensureAudioElement() {
        if (!audioEl) {
          audioEl = document.createElement("audio");
          audioEl.autoplay = true;
          audioEl.setAttribute("playsinline", "true");
          document.body.appendChild(audioEl);
        }
        return audioEl;
      }

      function attachAudio(track) {
        pendingAudioTrack = track;
        if (!listen) {
          hasAudio = false;
          updateStatus();
          return;
        }
        try {
          var el = ensureAudioElement();
          track.attach(el);
          el.muted = false;
          el.volume = 1;
          var play = el.play();
          if (play && play.then) {
            play.then(function () {
              hasAudio = true;
              tapEl.style.display = "none";
              updateStatus();
            }).catch(function () {
              tapEl.style.display = "flex";
              setStatus("Tap to enable cabin audio");
            });
          } else {
            hasAudio = true;
            updateStatus();
          }
          if (room && room.startAudio) {
            room.startAudio().then(function () {
              hasAudio = true;
              tapEl.style.display = "none";
              updateStatus();
            }).catch(function () {
              tapEl.style.display = "flex";
            });
          }
        } catch (e) {
          setStatus("Audio attach failed");
        }
      }

      function updateStatus() {
        if (hasVideo && listen && hasAudio) setStatus("Watching · listening (cabin)");
        else if (hasVideo && listen) setStatus("Cabin video · waiting for mic…");
        else if (hasVideo) setStatus("Watching cabin · audio muted");
        else if (listen) setStatus("Connected · waiting for cabin video + mic");
        else setStatus("Connected · waiting for cabin video");
      }

      function handleTrack(track, pub) {
        if (!track) return;
        var kind = kindOf(pub, track);
        var cabin = isCabin(pub, track);
        if (kind === "video") {
          if (cabin || !hasVideo) attachVideo(track);
          return;
        }
        if (kind === "audio") {
          if (cabin || !pendingAudioTrack) attachAudio(track);
        }
      }

      function wireParticipant(p) {
        if (!p) return;
        var pubs = p.trackPublications || p.tracks;
        if (pubs && pubs.forEach) {
          pubs.forEach(function (pub) {
            if (pub && pub.isSubscribed && pub.track) handleTrack(pub.track, pub);
          });
        }
      }

      tapEl.addEventListener("click", function () {
        if (!listen || !pendingAudioTrack) return;
        attachAudio(pendingAudioTrack);
        if (room && room.startAudio) room.startAudio().catch(function () {});
      });

      async function start() {
        try {
          var LK = window.LivekitClient || window.LiveKit;
          if (!LK || !LK.Room) {
            setStatus("LiveKit SDK failed to load");
            post({ type: "error", message: "LiveKit SDK failed to load" });
            return;
          }
          var Room = LK.Room;
          var RoomEvent = LK.RoomEvent;
          room = new Room({ adaptiveStream: true, dynacast: true });

          room.on(RoomEvent.TrackSubscribed, function (track, publication) {
            handleTrack(track, publication);
          });
          room.on(RoomEvent.ParticipantConnected, function (p) {
            wireParticipant(p);
          });
          room.on(RoomEvent.Disconnected, function () {
            setStatus("Disconnected");
            post({ type: "disconnected" });
          });

          setStatus("Connecting to cabin…");
          await room.connect(${url}, ${token});
          post({ type: "connected", room: room.name || "" });

          if (room.remoteParticipants && room.remoteParticipants.forEach) {
            room.remoteParticipants.forEach(wireParticipant);
          }
          updateStatus();
        } catch (err) {
          var msg = (err && err.message) ? err.message : "Connect failed";
          setStatus(msg);
          post({ type: "error", message: msg });
        }
      }

      start();
    })();
  </script>
</body>
</html>`;
}
