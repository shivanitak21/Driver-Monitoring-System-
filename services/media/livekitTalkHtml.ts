/**
 * LiveKit publisher HTML for Speak.
 * Publishes phone mic as track named "guardian-mic" (FRONTEND.md). Does not subscribe.
 *
 * Must load in a secure context (http://localhost or https) so navigator.mediaDevices exists.
 * Autoplay/mic capture also needs a user tap on Android WebView.
 */
export function buildLiveKitTalkHtml(options: { url: string; token: string }) {
  const url = JSON.stringify(options.url);
  const token = JSON.stringify(options.token);

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
  <style>
    html, body { margin: 0; padding: 0; width: 100%; height: 100%; background: #2a1010; font-family: -apple-system, system-ui, sans-serif; }
    #tap {
      position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
      color: #fff; font-size: 15px; font-weight: 600; padding: 16px; text-align: center;
      line-height: 1.35;
    }
  </style>
</head>
<body>
  <div id="tap">Tap to speak into cabin</div>
  <script>
    (function () {
      var tapEl = document.getElementById("tap");
      var room = null;
      var localTrack = null;
      var started = false;
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

      function ensureMediaDevices() {
        if (!navigator.mediaDevices) {
          navigator.mediaDevices = {};
        }
        if (typeof navigator.mediaDevices.getUserMedia !== "function") {
          var legacy =
            navigator.getUserMedia ||
            navigator.webkitGetUserMedia ||
            navigator.mozGetUserMedia ||
            navigator.msGetUserMedia;
          if (legacy) {
            navigator.mediaDevices.getUserMedia = function (constraints) {
              return new Promise(function (resolve, reject) {
                legacy.call(navigator, constraints, resolve, reject);
              });
            };
          }
        }
        return typeof navigator.mediaDevices.getUserMedia === "function";
      }

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

      async function publish() {
        if (started) return;
        started = true;
        tapEl.textContent = "Connecting…";
        try {
          if (!ensureMediaDevices()) {
            throw new Error(
              "Microphone API unavailable in this WebView. Use a build with mic permission, then tap again."
            );
          }

          // Warm mic under the user gesture (required on Android).
          try {
            var warm = await navigator.mediaDevices.getUserMedia({
              audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
              },
              video: false,
            });
            warm.getTracks().forEach(function (t) { t.stop(); });
          } catch (micErr) {
            throw new Error(
              (micErr && micErr.message) ? micErr.message : "Microphone permission denied"
            );
          }

          await ensureSdk();
          var LK = window.LivekitClient || window.LiveKit;
          if (!LK || !LK.Room) {
            throw new Error("LiveKit SDK failed to load");
          }

          room = new LK.Room();
          await room.connect(${url}, ${token});
          post({ type: "connected" });
          tapEl.textContent = "Publishing mic…";

          localTrack = await LK.createLocalAudioTrack({
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          });
          await room.localParticipant.publishTrack(localTrack, {
            name: "guardian-mic",
            source: LK.Track.Source.Microphone,
          });
          tapEl.textContent = "Speaking to cabin — tap End speak to stop";
          tapEl.style.background = "rgba(255,59,48,0.4)";
          post({ type: "publishing", track: "guardian-mic" });
        } catch (err) {
          started = false;
          var msg = (err && err.message) ? err.message : "Talk failed";
          tapEl.textContent = msg + " — tap to retry";
          post({ type: "error", message: msg });
        }
      }

      // Android WebView: mic capture must start from a user gesture.
      tapEl.addEventListener("click", function () { publish(); });
      post({ type: "ready", message: "Tap to speak into cabin" });
    })();
  </script>
</body>
</html>`;
}
