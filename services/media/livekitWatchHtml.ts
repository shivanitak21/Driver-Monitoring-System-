/**
 * Minimal LiveKit viewer HTML for WebView.
 * Subscribes to remote tracks named "cabin" (video + audio) per FRONTEND.md.
 * Page must be served from an http(s) base that allows the LiveKit ws/wss URL
 * (do not use https://localhost with ws:// — browsers block that).
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
    video { width: 100%; height: 100%; object-fit: cover; background: #000; }
    #tap {
      display: none; position: absolute; inset: 0; align-items: center; justify-content: center;
      background: rgba(0,0,0,0.45); color: #fff; font-size: 15px; font-weight: 600;
    }
    #status {
      position: absolute; left: 12px; bottom: 14px; max-width: 72%;
      padding: 7px 12px; border-radius: 999px;
      background: rgba(0,0,0,0.55); color: #f5f5f7; font-size: 12px; line-height: 1.35;
      pointer-events: none;
    }
  </style>
</head>
<body>
  <div id="stage"><video id="video" playsinline webkit-playsinline autoplay muted></video></div>
  <div id="tap">Tap to enable cabin audio</div>
  <div id="status">Loading player…</div>
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
      var remoteVideoTrack = null;
      var remoteAudioTrack = null;
      var mediaRecorder = null;
      var recordChunks = [];
      var recording = false;
      var cdns = [
        "https://cdn.jsdelivr.net/npm/livekit-client@2.9.1/dist/livekit-client.umd.min.js",
        "https://unpkg.com/livekit-client@2.9.1/dist/livekit-client.umd.min.js"
      ];

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
          remoteVideoTrack = track;
          track.attach(videoEl);
          videoEl.muted = true;
          videoEl.playsInline = true;
          videoEl.play().catch(function () {});
          hasVideo = true;
          post({ type: "track", kind: "video" });
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
        remoteAudioTrack = track;
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
              post({ type: "track", kind: "audio" });
              updateStatus();
            }).catch(function () {
              tapEl.style.display = "flex";
              setStatus("Tap to enable cabin audio");
            });
          } else {
            hasAudio = true;
            post({ type: "track", kind: "audio" });
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
        else setStatus("Connected · waiting for cabin publisher");
      }

      function handleTrack(track, pub) {
        if (!track) return;
        var kind = kindOf(pub, track);
        var cabin = isCabin(pub, track);
        if (kind === "video") {
          // Prefer cabin; otherwise take first video so a misnamed track still shows.
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

      function loadScript(src) {
        return new Promise(function (resolve, reject) {
          var s = document.createElement("script");
          s.src = src;
          s.async = true;
          s.onload = function () { resolve(src); };
          s.onerror = function () { reject(new Error("Failed " + src)); };
          document.head.appendChild(s);
        });
      }

      async function ensureSdk() {
        if (window.LivekitClient || window.LiveKit) return;
        var last = null;
        for (var i = 0; i < cdns.length; i++) {
          try {
            await loadScript(cdns[i]);
            if (window.LivekitClient || window.LiveKit) return;
          } catch (e) {
            last = e;
          }
        }
        throw last || new Error("LiveKit SDK failed to load");
      }

      async function start() {
        try {
          setStatus("Loading LiveKit…");
          await ensureSdk();
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
            setStatus("Publisher joined…");
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
          if (!room.remoteParticipants || room.remoteParticipants.size === 0) {
            setStatus("In room · waiting for car to publish cabin");
          } else {
            updateStatus();
          }
        } catch (err) {
          var msg = (err && err.message) ? err.message : "Connect failed";
          setStatus(msg);
          post({ type: "error", message: msg });
        }
      }

      function pickRecorderMime() {
        if (typeof MediaRecorder === "undefined") return null;
        var types = [
          "video/webm;codecs=vp8,opus",
          "video/webm;codecs=vp9,opus",
          "video/webm",
          "video/mp4"
        ];
        for (var i = 0; i < types.length; i++) {
          try {
            if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(types[i])) return types[i];
          } catch (e) {}
        }
        return "";
      }

      function buildRecordStream() {
        var stream = new MediaStream();
        var added = 0;
        try {
          if (videoEl && videoEl.srcObject) {
            videoEl.srcObject.getTracks().forEach(function (t) {
              stream.addTrack(t);
              added += 1;
            });
          }
        } catch (e) {}
        if (added === 0 && remoteVideoTrack && remoteVideoTrack.mediaStreamTrack) {
          stream.addTrack(remoteVideoTrack.mediaStreamTrack);
          added += 1;
        }
        if (remoteAudioTrack && remoteAudioTrack.mediaStreamTrack) {
          try {
            stream.addTrack(remoteAudioTrack.mediaStreamTrack);
            added += 1;
          } catch (e) {}
        } else if (audioEl && audioEl.srcObject) {
          try {
            audioEl.srcObject.getAudioTracks().forEach(function (t) {
              stream.addTrack(t);
              added += 1;
            });
          } catch (e) {}
        }
        return added > 0 ? stream : null;
      }

      function postBase64Chunks(dataUrl, mime) {
        var parts = String(dataUrl || "").split(",");
        var b64 = parts.length > 1 ? parts[1] : parts[0];
        if (!b64) {
          post({ type: "recording-error", message: "Empty recording" });
          return;
        }
        var chunkSize = 180000;
        var total = Math.ceil(b64.length / chunkSize) || 1;
        post({ type: "recording-begin", total: total, mime: mime || "video/webm", bytes: b64.length });
        for (var i = 0; i < total; i++) {
          post({
            type: "recording-chunk",
            index: i,
            total: total,
            data: b64.slice(i * chunkSize, (i + 1) * chunkSize)
          });
        }
        post({ type: "recording-done", total: total, mime: mime || "video/webm" });
      }

      window.__vmsStartLocalRecord = function () {
        try {
          if (recording) {
            post({ type: "recording-status", message: "already recording" });
            return;
          }
          if (typeof MediaRecorder === "undefined") {
            post({ type: "recording-error", message: "MediaRecorder not available on this WebView" });
            return;
          }
          var stream = buildRecordStream();
          if (!stream) {
            post({ type: "recording-error", message: "No live cabin video yet. Wait until the picture is moving, then Record." });
            return;
          }
          var mime = pickRecorderMime();
          recordChunks = [];
          mediaRecorder = mime
            ? new MediaRecorder(stream, { mimeType: mime })
            : new MediaRecorder(stream);
          var usedMime = mediaRecorder.mimeType || mime || "video/webm";
          mediaRecorder.ondataavailable = function (ev) {
            if (ev.data && ev.data.size > 0) recordChunks.push(ev.data);
          };
          mediaRecorder.onerror = function () {
            recording = false;
            post({ type: "recording-error", message: "Recorder failed" });
          };
          mediaRecorder.onstop = function () {
            recording = false;
            var blob = new Blob(recordChunks, { type: usedMime });
            recordChunks = [];
            if (!blob.size) {
              post({ type: "recording-error", message: "Recording was empty" });
              return;
            }
            var reader = new FileReader();
            reader.onloadend = function () {
              postBase64Chunks(String(reader.result || ""), usedMime);
            };
            reader.onerror = function () {
              post({ type: "recording-error", message: "Could not read recording" });
            };
            reader.readAsDataURL(blob);
          };
          mediaRecorder.start(1000);
          recording = true;
          post({ type: "recording-started", mime: usedMime });
          setStatus("Recording cabin locally…");
        } catch (err) {
          recording = false;
          post({ type: "recording-error", message: (err && err.message) ? err.message : "Record start failed" });
        }
      };

      window.__vmsStopLocalRecord = function () {
        try {
          if (!mediaRecorder || !recording) {
            post({ type: "recording-error", message: "Not recording" });
            return;
          }
          setStatus("Saving local recording…");
          mediaRecorder.stop();
        } catch (err) {
          recording = false;
          post({ type: "recording-error", message: (err && err.message) ? err.message : "Record stop failed" });
        }
      };

      start();
    })();
  </script>
</body>
</html>`;
}
