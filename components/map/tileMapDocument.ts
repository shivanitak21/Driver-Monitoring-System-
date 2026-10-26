import { carMarkerSvg } from "@/components/map/carArt";
import type { Coordinate } from "@/types/domain";

type TileMapInput = {
  route: Coordinate[];
  origin: Coordinate;
  destination: Coordinate;
  position: Coordinate;
  heading: number;
  trail: Coordinate[];
  deviceFix: Coordinate | null;
  follow: boolean;
  scheme: "light" | "dark";
  reduceMotion: boolean;
};

/** Street map used when the Google Maps JavaScript API rejects the key. */
export function buildTileMapHtml(input: TileMapInput) {
  const scheme = input.scheme;
  const background = scheme === "light" ? "#E4E7EB" : "#1C1C1C";
  const tiles =
    scheme === "light"
      ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/"
      : "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/";
  const trail = scheme === "light" ? "#4C6110" : "#D7F76B";
  const road = scheme === "light" ? "rgba(23,25,29,0.55)" : "rgba(245,246,247,0.82)";
  const dest = scheme === "light" ? "#1F6F6A" : "#8FD4D0";
  const origin = scheme === "light" ? "#6A7180" : "#C5CCD4";
  const ink = scheme === "light" ? "#5C6370" : "#A1A6AF";
  const chip = scheme === "light" ? "rgba(255,255,255,0.9)" : "rgba(16,18,22,0.82)";
  const snapshot = JSON.stringify({
    route: input.route,
    origin: input.origin,
    destination: input.destination,
    position: input.position,
    heading: input.heading,
    trail: input.trail,
    deviceFix: input.deviceFix,
    follow: input.follow,
    reduceMotion: input.reduceMotion,
    background,
    tiles,
    trailColor: trail,
    roadColor: road,
    destColor: dest,
    originColor: origin,
  });
  const icon = JSON.stringify(carMarkerSvg(0));

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <style>
    html, body, #map { height: 100%; margin: 0; background: ${background}; overflow: hidden; touch-action: none; }
    #map { position: relative; }
    .tile { position: absolute; width: 256px; height: 256px; pointer-events: none; }
    #overlay { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
    #car { position: absolute; width: 56px; height: 56px; z-index: 2; }
    .attr {
      position: absolute; top: 8px; right: 8px; z-index: 3;
      font: 500 11px/1.2 sans-serif; color: ${ink};
      background: ${chip}; border-radius: 8px; padding: 4px 6px;
    }
    .zoom {
      position: absolute; right: 16px; top: 46%; transform: translateY(-50%);
      z-index: 4; display: flex; flex-direction: column; gap: 8px;
    }
    .zoom button {
      width: 44px; height: 44px; border: 0; border-radius: 22px;
      background: ${chip}; color: ${scheme === "light" ? "#17191D" : "#F5F6F7"};
      font: 500 22px/1 sans-serif;
    }
  </style>
</head>
<body>
  <div id="map">
    <svg id="overlay" xmlns="http://www.w3.org/2000/svg"></svg>
    <img id="car" alt="" />
    <div class="zoom">
      <button type="button" id="zoom-in" aria-label="Zoom in">+</button>
      <button type="button" id="zoom-out" aria-label="Zoom out">−</button>
    </div>
    <div class="attr">© Esri</div>
  </div>
  <script>
    const snapshot = ${snapshot};
    const icon = ${icon};
    const state = {
      level: 15,
      follow: snapshot.follow,
      route: snapshot.route || [],
      trail: snapshot.trail || [],
      origin: snapshot.origin,
      destination: snapshot.destination,
      deviceFix: snapshot.deviceFix,
      cam: { x: 0, y: 0 },
      ready: false,
      queued: null,
      raf: 0,
      drag: null,
      moved: false,
      tiles: new Map(),
      display: { lat: snapshot.position.latitude, lng: snapshot.position.longitude, heading: snapshot.heading || 0 },
      target: { lat: snapshot.position.latitude, lng: snapshot.position.longitude, heading: snapshot.heading || 0 }
    };
    const mapEl = document.getElementById("map");
    const overlay = document.getElementById("overlay");
    const car = document.getElementById("car");
    car.src = "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(icon);

    function post(message) {
      if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify(message));
      else if (window.parent && window.parent !== window) window.parent.postMessage(message, "*");
    }

    function world(lat, lng) {
      const scale = 256 * Math.pow(2, state.level);
      const x = ((lng + 180) / 360) * scale;
      const clamped = Math.max(-0.9999, Math.min(0.9999, Math.sin(lat * Math.PI / 180)));
      const y = (0.5 - Math.log((1 + clamped) / (1 - clamped)) / (4 * Math.PI)) * scale;
      return { x: x, y: y };
    }

    function screen(lat, lng) {
      const point = world(lat, lng);
      return { x: point.x - state.cam.x + mapEl.clientWidth / 2, y: point.y - state.cam.y + mapEl.clientHeight / 2 };
    }

    function followCamera() {
      if (!state.follow) return;
      const point = world(state.display.lat, state.display.lng);
      state.cam.x = point.x;
      state.cam.y = point.y + mapEl.clientHeight * 0.1;
    }

    function drawTiles() {
      const width = mapEl.clientWidth;
      const height = mapEl.clientHeight;
      if (width < 2 || height < 2) return;
      const tileZoom = Math.max(3, Math.min(18, Math.round(state.level)));
      const tileSize = 256 * Math.pow(2, state.level - tileZoom);
      const left = state.cam.x - width / 2;
      const top = state.cam.y - height / 2;
      const n = Math.pow(2, tileZoom);
      const x0 = Math.floor(left / tileSize) - 1;
      const y0 = Math.floor(top / tileSize) - 1;
      const x1 = Math.floor((left + width) / tileSize) + 1;
      const y1 = Math.floor((top + height) / tileSize) + 1;
      const live = new Set();
      for (let ty = y0; ty <= y1; ty += 1) {
        if (ty < 0 || ty >= n) continue;
        for (let tx = x0; tx <= x1; tx += 1) {
          const wrapped = ((tx % n) + n) % n;
          const key = tileZoom + "/" + ty + "/" + wrapped;
          live.add(key);
          let img = state.tiles.get(key);
          if (!img) {
            img = document.createElement("img");
            img.className = "tile";
            img.alt = "";
            img.draggable = false;
            img.src = snapshot.tiles + tileZoom + "/" + ty + "/" + wrapped;
            mapEl.insertBefore(img, overlay);
            state.tiles.set(key, img);
          }
          img.style.width = tileSize + "px";
          img.style.height = tileSize + "px";
          img.style.left = (tx * tileSize - left) + "px";
          img.style.top = (ty * tileSize - top) + "px";
        }
      }
      state.tiles.forEach(function (img, key) {
        if (!live.has(key)) {
          img.remove();
          state.tiles.delete(key);
        }
      });
    }

    function svgLine(points, color, width) {
      const node = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
      node.setAttribute("fill", "none");
      node.setAttribute("stroke", color);
      node.setAttribute("stroke-width", String(width));
      node.setAttribute("stroke-linecap", "round");
      node.setAttribute("stroke-linejoin", "round");
      node.setAttribute("points", points);
      return node;
    }

    function dot(lat, lng, color, radius) {
      const point = screen(lat, lng);
      const node = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      node.setAttribute("cx", String(point.x));
      node.setAttribute("cy", String(point.y));
      node.setAttribute("r", String(radius));
      node.setAttribute("fill", color);
      return node;
    }

    function series(list) {
      return (list || []).map(function (point) {
        const at = screen(point.latitude, point.longitude);
        return at.x + "," + at.y;
      }).join(" ");
    }

    function draw() {
      followCamera();
      drawTiles();
      const width = mapEl.clientWidth;
      const height = mapEl.clientHeight;
      overlay.setAttribute("viewBox", "0 0 " + width + " " + height);
      const nodes = [];
      if ((state.route || []).length > 1) nodes.push(svgLine(series(state.route), snapshot.roadColor, 4));
      if ((state.trail || []).length > 1) nodes.push(svgLine(series(state.trail), snapshot.trailColor, 4));
      if (state.origin) nodes.push(dot(state.origin.latitude, state.origin.longitude, snapshot.originColor, 5));
      if (state.destination) nodes.push(dot(state.destination.latitude, state.destination.longitude, snapshot.destColor, 7));
      if (state.deviceFix) nodes.push(dot(state.deviceFix.latitude, state.deviceFix.longitude, "#7EB6FF", 6));
      overlay.replaceChildren.apply(overlay, nodes);
      const at = screen(state.display.lat, state.display.lng);
      car.style.left = (at.x - 28) + "px";
      car.style.top = (at.y - 28) + "px";
      car.style.transform = "rotate(" + state.display.heading + "deg)";
    }

    function wrap(delta) {
      let value = delta;
      while (value > 180) value -= 360;
      while (value < -180) value += 360;
      return value;
    }

    function tick() {
      state.raf = 0;
      const dLat = state.target.lat - state.display.lat;
      const dLng = state.target.lng - state.display.lng;
      const dH = wrap(state.target.heading - state.display.heading);
      const jump = Math.abs(dLat) > 0.02 || Math.abs(dLng) > 0.02;
      const step = snapshot.reduceMotion || jump ? 1 : 0.22;
      state.display.lat += dLat * step;
      state.display.lng += dLng * step;
      state.display.heading += dH * step;
      draw();
      const done = Math.abs(state.target.lat - state.display.lat) < 0.00001 && Math.abs(state.target.lng - state.display.lng) < 0.00001 && Math.abs(wrap(state.target.heading - state.display.heading)) < 0.4;
      if (!done) state.raf = requestAnimationFrame(tick);
    }

    function kick() {
      if (!state.raf) state.raf = requestAnimationFrame(tick);
    }

    function apply(data) {
      if (typeof data === "string") {
        try { data = JSON.parse(data); } catch (error) { return; }
      }
      if (!data || !data.position) return;
      if (!state.ready) {
        state.queued = data;
        return;
      }
      if (data.route && data.route.length) {
        state.route = data.route;
        state.origin = data.route[0];
        state.destination = data.route[data.route.length - 1];
      }
      state.trail = data.trail || [];
      state.deviceFix = data.deviceFix || null;
      state.follow = !!data.follow;
      state.target = { lat: data.position.latitude, lng: data.position.longitude, heading: data.heading || 0 };
      kick();
    }

    window.updateRide = apply;
    window.addEventListener("message", function (event) {
      const data = event.data;
      if (!data || data.type !== "ride" || !data.payload) return;
      apply(data.payload);
    });
    window.addEventListener("resize", draw);

    const pointers = new Map();
    let pinch = null;
    let lastTap = 0;

    function localPoint(event) {
      const rect = mapEl.getBoundingClientRect();
      return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    }

    function span(points) {
      const first = points[0];
      const second = points[1];
      return Math.hypot(first.x - second.x, first.y - second.y);
    }

    function setLevel(next, sx, sy) {
      const clamped = Math.max(11, Math.min(18, next));
      if (Math.abs(clamped - state.level) < 0.001) return;
      const width = mapEl.clientWidth;
      const height = mapEl.clientHeight;
      const anchorX = state.cam.x - width / 2 + sx;
      const anchorY = state.cam.y - height / 2 + sy;
      const factor = Math.pow(2, clamped - state.level);
      state.level = clamped;
      state.cam.x = anchorX * factor - sx + width / 2;
      state.cam.y = anchorY * factor - sy + height / 2;
      state.follow = false;
      draw();
    }

    mapEl.addEventListener("wheel", function (event) {
      event.preventDefault();
      const at = localPoint(event);
      setLevel(state.level + (event.deltaY < 0 ? 0.6 : -0.6), at.x, at.y);
      post({ type: "pan" });
    }, { passive: false });

    document.getElementById("zoom-in").addEventListener("click", function (event) {
      event.stopPropagation();
      setLevel(Math.round(state.level) + 1, mapEl.clientWidth / 2, mapEl.clientHeight * 0.4);
      post({ type: "pan" });
    });
    document.getElementById("zoom-out").addEventListener("click", function (event) {
      event.stopPropagation();
      setLevel(Math.round(state.level) - 1, mapEl.clientWidth / 2, mapEl.clientHeight * 0.4);
      post({ type: "pan" });
    });

    mapEl.addEventListener("pointerdown", function (event) {
      if (event.target.closest && event.target.closest(".zoom")) return;
      if (event.target === car) return;
      pointers.set(event.pointerId, localPoint(event));
      if (pointers.size >= 2) {
        const points = Array.from(pointers.values());
        pinch = { dist: span(points), level: state.level };
        state.drag = null;
        return;
      }
      state.drag = { x: event.clientX, y: event.clientY, camX: state.cam.x, camY: state.cam.y };
      state.moved = false;
      mapEl.setPointerCapture(event.pointerId);
    });
    mapEl.addEventListener("pointermove", function (event) {
      if (!pointers.has(event.pointerId)) return;
      pointers.set(event.pointerId, localPoint(event));
      if (pointers.size >= 2) {
        const points = Array.from(pointers.values());
        const dist = span(points);
        const mid = { x: (points[0].x + points[1].x) / 2, y: (points[0].y + points[1].y) / 2 };
        if (!pinch) pinch = { dist: dist, level: state.level };
        setLevel(pinch.level + Math.log2(dist / pinch.dist), mid.x, mid.y);
        state.moved = true;
        return;
      }
      if (!state.drag) return;
      const dx = event.clientX - state.drag.x;
      const dy = event.clientY - state.drag.y;
      if (Math.abs(dx) + Math.abs(dy) < 6) return;
      state.moved = true;
      state.follow = false;
      state.cam.x = state.drag.camX - dx;
      state.cam.y = state.drag.camY - dy;
      draw();
    });
    mapEl.addEventListener("pointerup", function (event) {
      if (event.target.closest && event.target.closest(".zoom")) return;
      pointers.delete(event.pointerId);
      pinch = null;
      if (pointers.size === 0 && !state.moved) {
        const now = Date.now();
        if (now - lastTap < 280) {
          const at = localPoint(event);
          setLevel(state.level + 1, at.x, at.y);
          post({ type: "pan" });
          lastTap = 0;
        } else {
          lastTap = now;
        }
      }
      if (state.moved && pointers.size === 0) post({ type: "pan" });
      if (pointers.size === 0) state.drag = null;
    });
    mapEl.addEventListener("pointercancel", function (event) {
      pointers.delete(event.pointerId);
      pinch = null;
      state.drag = null;
    });
    car.addEventListener("click", function (event) {
      event.stopPropagation();
      post({ type: "vehicle" });
    });

    followCamera();
    state.ready = true;
    if (state.queued) apply(state.queued);
    draw();
    post({ type: "ready" });
  </script>
</body>
</html>`;
}
