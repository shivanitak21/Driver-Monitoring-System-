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
  /** When set, use Mapbox raster tiles (works in Android WebView without WebGL). */
  mapboxToken?: string;
};

/**
 * Leaflet + raster tiles. Custom tile math broke on zoom; Leaflet keeps tiles visible.
 * Same window.updateRide contract as before.
 */
export function buildTileMapHtml(input: TileMapInput) {
  const scheme = input.scheme;
  const background = scheme === "light" ? "#E6E8EB" : "#12151A";
  const token = input.mapboxToken?.trim() ?? "";
  const useMapbox = token.length > 0;
  const mapboxStyle = scheme === "light" ? "mapbox/light-v11" : "mapbox/dark-v11";
  const trail = scheme === "light" ? "#1C1C1E" : "#F5F5F7";
  const road = scheme === "light" ? "rgba(23,25,29,0.45)" : "rgba(245,246,247,0.55)";
  const dest = scheme === "light" ? "#3A3A3C" : "#D1D1D6";
  const origin = scheme === "light" ? "#6A7180" : "#C5CCD4";
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
    useMapbox,
    mapboxToken: token,
    mapboxStyle,
    trailColor: trail,
    roadColor: road,
    destColor: dest,
    originColor: origin,
  });
  const iconAtZero = JSON.stringify(carMarkerSvg(0));

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    html, body, #map { height: 100%; margin: 0; background: ${background}; }
    .leaflet-container { background: ${background}; font: 12px/1.4 system-ui, sans-serif; }
    .car-icon {
      width: 56px;
      height: 56px;
      background-size: contain;
      background-repeat: no-repeat;
      background-position: center;
    }
    .dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      border: 2px solid ${background};
      box-sizing: border-box;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    const snapshot = ${snapshot};
    const iconTemplate = ${iconAtZero};

    function post(message) {
      if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify(message));
      else if (window.parent && window.parent !== window) window.parent.postMessage(message, "*");
    }

    function latLng(point) {
      return [point.latitude, point.longitude];
    }

    function carIconUrl(heading) {
      const svg = iconTemplate.replace("rotate(0 48 48)", "rotate(" + heading + " 48 48)");
      return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg);
    }

    function makeCarIcon(heading) {
      return L.divIcon({
        className: "",
        html: '<div class="car-icon" style="background-image:url(\\'' + carIconUrl(heading) + '\\')"></div>',
        iconSize: [56, 56],
        iconAnchor: [28, 28]
      });
    }

    function makeDot(color, size) {
      return L.divIcon({
        className: "",
        html: '<div class="dot" style="width:' + size + 'px;height:' + size + 'px;background:' + color + '"></div>',
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2]
      });
    }

    const state = {
      map: null,
      routeLine: null,
      trailLine: null,
      originMarker: null,
      destMarker: null,
      deviceMarker: null,
      carMarker: null,
      follow: !!snapshot.follow,
      userNav: false,
      heading: snapshot.heading || 0,
      iconHeading: null,
      ready: false,
      queued: null,
      raf: 0,
      display: {
        lat: snapshot.position.latitude,
        lng: snapshot.position.longitude,
        heading: snapshot.heading || 0
      },
      target: {
        lat: snapshot.position.latitude,
        lng: snapshot.position.longitude,
        heading: snapshot.heading || 0
      }
    };

    function wrap(delta) {
      let value = delta;
      while (value > 180) value -= 360;
      while (value < -180) value += 360;
      return value;
    }

    function setCar(lat, lng, heading) {
      if (!state.carMarker) return;
      state.carMarker.setLatLng([lat, lng]);
      const rounded = Math.round(heading);
      if (state.iconHeading === null || Math.abs(rounded - state.iconHeading) >= 4) {
        state.iconHeading = rounded;
        state.carMarker.setIcon(makeCarIcon(heading));
      }
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
      setCar(state.display.lat, state.display.lng, state.display.heading);
      if (state.follow && state.map) {
        const center = [state.display.lat - 0.0028, state.display.lng];
        if (jump) state.map.setView(center, state.map.getZoom(), { animate: false });
        else state.map.panTo(center, { animate: false });
      }
      const done =
        Math.abs(state.target.lat - state.display.lat) < 0.00001 &&
        Math.abs(state.target.lng - state.display.lng) < 0.00001 &&
        Math.abs(wrap(state.target.heading - state.display.heading)) < 0.4;
      if (!done) state.raf = requestAnimationFrame(tick);
    }

    function kick() {
      if (!state.raf) state.raf = requestAnimationFrame(tick);
    }

    function stopFollow() {
      if (state.userNav && !state.follow) return;
      state.follow = false;
      state.userNav = true;
      post({ type: "pan" });
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
        state.routeLine.setLatLngs(data.route.map(latLng));
        state.originMarker.setLatLng(latLng(data.route[0]));
        state.destMarker.setLatLng(latLng(data.route[data.route.length - 1]));
      }
      state.trailLine.setLatLngs((data.trail || []).map(latLng));

      if (data.deviceFix) {
        state.deviceMarker.setLatLng(latLng(data.deviceFix));
        state.deviceMarker.setOpacity(1);
      } else {
        state.deviceMarker.setOpacity(0);
      }

      if (!state.userNav) state.follow = !!data.follow;
      else state.follow = false;

      state.target = {
        lat: data.position.latitude,
        lng: data.position.longitude,
        heading: data.heading || 0
      };
      kick();
    }

    window.updateRide = apply;

    function baseLayer() {
      if (snapshot.useMapbox) {
        return L.tileLayer(
          "https://api.mapbox.com/styles/v1/" + snapshot.mapboxStyle + "/tiles/{z}/{x}/{y}?access_token=" + encodeURIComponent(snapshot.mapboxToken),
          {
            tileSize: 512,
            zoomOffset: -1,
            minZoom: 2,
            maxZoom: 20,
            attribution: "© Mapbox © OpenStreetMap",
            updateWhenZooming: true,
            keepBuffer: 6,
            crossOrigin: true
          }
        );
      }
      const url =
        snapshot.background === "#E6E8EB"
          ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"
          : "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}";
      return L.tileLayer(url, {
        minZoom: 3,
        maxZoom: 19,
        attribution: "© Esri",
        updateWhenZooming: true,
        keepBuffer: 4
      });
    }

    function init() {
      if (!window.L) {
        post({ type: "auth" });
        return;
      }

      const start = latLng(snapshot.position);
      const center = snapshot.follow
        ? [snapshot.position.latitude - 0.0028, snapshot.position.longitude]
        : start;

      state.map = L.map("map", {
        zoomControl: true,
        attributionControl: true,
        zoomSnap: 1,
        zoomDelta: 1
      }).setView(center, 15);

      baseLayer().addTo(state.map);

      state.routeLine = L.polyline((snapshot.route || []).map(latLng), {
        color: snapshot.roadColor,
        weight: 4,
        opacity: 0.85,
        lineJoin: "round"
      }).addTo(state.map);

      state.trailLine = L.polyline((snapshot.trail || []).map(latLng), {
        color: snapshot.trailColor,
        weight: 4,
        opacity: 0.95,
        lineJoin: "round"
      }).addTo(state.map);

      state.originMarker = L.marker(latLng(snapshot.origin), {
        icon: makeDot(snapshot.originColor, 10),
        interactive: false
      }).addTo(state.map);

      state.destMarker = L.marker(latLng(snapshot.destination), {
        icon: makeDot(snapshot.destColor, 14),
        interactive: false
      }).addTo(state.map);

      state.deviceMarker = L.marker(snapshot.deviceFix ? latLng(snapshot.deviceFix) : start, {
        icon: makeDot("#7EB6FF", 12),
        interactive: false,
        opacity: snapshot.deviceFix ? 1 : 0
      }).addTo(state.map);

      state.carMarker = L.marker(start, {
        icon: makeCarIcon(snapshot.heading || 0),
        zIndexOffset: 600
      }).addTo(state.map);
      state.iconHeading = Math.round(snapshot.heading || 0);
      state.carMarker.on("click", function () { post({ type: "vehicle" }); });

      state.map.on("dragstart", stopFollow);
      state.map.on("zoomstart", stopFollow);

      // Force a layout pass after WebView shows — fixes blank first paint / zoom.
      setTimeout(function () {
        state.map.invalidateSize(false);
      }, 80);
      setTimeout(function () {
        state.map.invalidateSize(false);
      }, 300);

      state.ready = true;
      if (state.queued) apply(state.queued);
      post({ type: "ready" });
    }

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", init);
    } else {
      init();
    }
  </script>
</body>
</html>`;
}
