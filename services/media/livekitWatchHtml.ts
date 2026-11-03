/**
 * LiveKit viewer for Watch.
 * Subscribes to video tracks named "driver" and "cabin", and the audio track named "cabin".
 * Pictures use object-fit: contain so the camera frame is not cropped or stretched.
 */
export function buildLiveKitWatchHtml(options: {
  url: string;
  token: string;
  /** When false, cabin audio stays muted (Watch without Listen). */
  listen: boolean;
  /** both | driver | cabin */
  layout: "both" | "driver" | "cabin";
  /** driver | cabin — which pane a snapshot will use */
  selected: "driver" | "cabin";
  driverPoster?: string;
  cabinPoster?: string;
}) {
  const url = JSON.stringify(options.url);
  const token = JSON.stringify(options.token);
  const listen = options.listen ? "true" : "false";
  const layout = JSON.stringify(options.layout);
  const selected = JSON.stringify(options.selected);
  const driverPoster = JSON.stringify(options.driverPoster || "");
  const cabinPoster = JSON.stringify(options.cabinPoster || "");

  return `<!DOCTYPE html>
<html data-layout=${layout} data-selected=${selected}>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <style>
    html, body { margin: 0; height: 100%; background: #000; font-family: -apple-system, system-ui, sans-serif; }
    #stage { box-sizing: border-box; height: 100%; display: flex; flex-direction: column; gap: 4px; padding: 0; }
    button.pane {
      display: block; width: 100%; padding: 0; margin: 0; appearance: none; -webkit-appearance: none;
      position: relative; flex: 1 1 auto; min-height: 0; border-radius: 0; overflow: hidden;
      background: #000; border: 0; color: inherit; font: inherit; text-align: left;
    }
    html[data-layout="driver"] .pane-cabin, html[data-layout="cabin"] .pane-driver { display: none; }
    html[data-selected="driver"] .pane-driver, html[data-selected="cabin"] .pane-cabin { box-shadow: inset 0 0 0 2px #D7F76B; }
    video, .poster { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; object-position: center; }
    .poster { z-index: 0; background: #000; }
    video { z-index: 1; background: transparent; }
    .tag {
      position: absolute; top: 10px; display: flex; align-items: center; gap: 6px;
      padding: 5px 10px; border-radius: 999px; background: rgba(0,0,0,0.55); color: #F5F6F7;
      font-size: 12px; font-weight: 600; letter-spacing: 0.01em;
    }
    .tag.left { left: 10px; }
    .tag.right { right: 10px; }
    .dot { width: 7px; height: 7px; border-radius: 4px; background: #8B929C; }
    .pane.on .dot { background: #FF453A; }
    #tap {
      display: none; position: absolute; left: 8px; right: 8px; bottom: 8px; z-index: 3;
      padding: 12px; border-radius: 14px; text-align: center;
      background: rgba(0,0,0,0.62); color: #fff; font-size: 14px; font-weight: 600;
    }
    #status { display: none; }
  </style>
</head>
<body>
  <div id="stage">
    <button type="button" class="pane pane-driver" id="pane-driver" aria-label="Driver camera">
      <img class="poster" id="poster-driver" alt="" />
      <video id="video-driver" playsinline webkit-playsinline autoplay muted></video>
      <span class="tag left"><span class="dot"></span>Driver</span>
      <span class="tag right" id="state-driver">Waiting</span>
    </button>
    <button type="button" class="pane pane-cabin" id="pane-cabin" aria-label="Cabin camera">
      <img class="poster" id="poster-cabin" alt="" />
      <video id="video-cabin" playsinline webkit-playsinline autoplay muted></video>
      <span class="tag left"><span class="dot"></span>Cabin</span>
      <span class="tag right" id="state-cabin">Waiting</span>
    </button>
  </div>
  <div id="tap">Tap to enable cabin audio</div>
  <div id="status"></div>
  <script>
    (function () {
      var statusEl = document.getElementById("status");
      var tapEl = document.getElementById("tap");
      var listen = ${listen};
      var room = null;
      var audioEl = null;
      var pendingAudioTrack = null;
      var hasDriver = false;
      var hasCabin = false;
      var hasAudio = false;
      var cdns = [
        "https://cdn.jsdelivr.net/npm/livekit-client@2.9.1/dist/livekit-client.umd.min.js",
        "https://unpkg.com/livekit-client@2.9.1/dist/livekit-client.umd.min.js"
      ];

      function setPoster(id, src) {
        var img = document.getElementById(id);
        if (!img) return;
        if (!src) { img.style.display = "none"; return; }
        img.src = src;
      }
      setPoster("poster-driver", ${driverPoster});
      setPoster("poster-cabin", ${cabinPoster});

      function post(payload) {
        try {
          if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify(payload));
        } catch (e) {}
      }
      function setStatus(msg) {
        statusEl.textContent = msg;
        post({ type: "status", message: msg });
      }
      function report() {
        post({ type: "tracks", driver: hasDriver, cabin: hasCabin, audio: hasAudio });
        if (hasDriver && hasCabin && listen && hasAudio) setStatus("Driver and cabin live · listening");
        else if (hasDriver && hasCabin) setStatus(listen ? "Driver and cabin live · waiting for mic" : "Driver and cabin live");
        else if (hasDriver || hasCabin) setStatus("One camera live · waiting for the other");
        else setStatus("In room · waiting for the car to publish");
      }
      function trackName(pub, track) {
        var name = "";
        if (pub) name = pub.trackName || pub.name || "";
        if (!name && track) name = track.name || "";
        return String(name || "").toLowerCase();
      }
      function kindOf(pub, track) {
        if (pub && pub.kind) return String(pub.kind);
        if (track && track.kind) return String(track.kind);
        return "";
      }
      function attachVideo(track, which) {
        var video = document.getElementById(which === "driver" ? "video-driver" : "video-cabin");
        var pane = document.getElementById(which === "driver" ? "pane-driver" : "pane-cabin");
        var state = document.getElementById(which === "driver" ? "state-driver" : "state-cabin");
        var poster = document.getElementById(which === "driver" ? "poster-driver" : "poster-cabin");
        if (!video) return;
        try {
          track.attach(video);
          video.muted = true;
          video.playsInline = true;
          video.play().catch(function () {});
          if (poster) poster.style.display = "none";
          if (pane) pane.classList.add("on");
          if (state) state.textContent = "Live";
          if (which === "driver") hasDriver = true;
          else hasCabin = true;
          post({ type: "track", kind: "video", name: which });
          report();
        } catch (e) {
          setStatus("Could not attach the " + which + " camera");
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
        if (!listen) { hasAudio = false; report(); return; }
        try {
          var el = ensureAudioElement();
          track.attach(el);
          el.muted = false;
          el.volume = 1;
          var play = el.play();
          var ok = function () {
            hasAudio = true;
            tapEl.style.display = "none";
            post({ type: "track", kind: "audio", name: "cabin" });
            report();
          };
          if (play && play.then) play.then(ok).catch(function () { tapEl.style.display = "block"; setStatus("Tap to enable cabin audio"); });
          else ok();
          if (room && room.startAudio) room.startAudio().then(ok).catch(function () { tapEl.style.display = "block"; });
        } catch (e) {
          setStatus("Cabin audio failed to start");
        }
      }
      function handleTrack(track, pub) {
        if (!track) return;
        var name = trackName(pub, track);
        var kind = kindOf(pub, track);
        if (name === "driver" && kind !== "audio") { attachVideo(track, "driver"); return; }
        if (name === "cabin" && kind === "audio") { attachAudio(track); return; }
        if (name === "cabin" && kind !== "audio") { attachVideo(track, "cabin"); return; }
        if (kind === "audio") attachAudio(track);
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
      window.__vmsSetLayout = function (mode) {
        document.documentElement.setAttribute("data-layout", mode === "driver" || mode === "cabin" ? mode : "both");
      };
      window.__vmsSetSelected = function (name) {
        document.documentElement.setAttribute("data-selected", name === "cabin" ? "cabin" : "driver");
      };
      window.__vmsSetPanes = function () {};
      function noteAspect(which, el) {
        var w = el.videoWidth || el.naturalWidth || 0;
        var h = el.videoHeight || el.naturalHeight || 0;
        if (w < 2 || h < 2) return;
        post({ type: "aspect", channel: which, width: w, height: h });
      }
      ["driver", "cabin"].forEach(function (which) {
        var video = document.getElementById("video-" + which);
        var poster = document.getElementById("poster-" + which);
        if (video) video.addEventListener("loadedmetadata", function () { noteAspect(which, video); });
        if (poster) poster.addEventListener("load", function () { noteAspect(which, poster); });
      });
      document.getElementById("pane-driver").addEventListener("click", function () {
        window.__vmsSetSelected("driver");
        post({ type: "select", channel: "dms" });
      });
      document.getElementById("pane-cabin").addEventListener("click", function () {
        window.__vmsSetSelected("cabin");
        post({ type: "select", channel: "cms" });
      });
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
          } catch (e) { last = e; }
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
          room = new LK.Room({ adaptiveStream: true, dynacast: true });
          room.on(LK.RoomEvent.TrackSubscribed, function (track, publication) { handleTrack(track, publication); });
          room.on(LK.RoomEvent.ParticipantConnected, function (p) { wireParticipant(p); });
          room.on(LK.RoomEvent.Disconnected, function () {
            hasDriver = false;
            hasCabin = false;
            hasAudio = false;
            setStatus("Disconnected");
            post({ type: "disconnected" });
            report();
          });
          setStatus("Connecting…");
          await room.connect(${url}, ${token});
          post({ type: "connected", room: room.name || "" });
          if (room.remoteParticipants && room.remoteParticipants.forEach) room.remoteParticipants.forEach(wireParticipant);
          report();
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
