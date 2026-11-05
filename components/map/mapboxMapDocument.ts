import { carMarkerSvg } from "@/components/map/carArt";
import type { Coordinate } from "@/types/domain";

type MapDocumentInput = {
  accessToken: string;
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

/** Mapbox GL JS document — same updateRide contract as the old Google map WebView. */
export function buildMapboxMapHtml(input: MapDocumentInput) {
  const scheme = input.scheme;
  const background = scheme === "light" ? "#E6E8EB" : "#12151A";
  const trail = scheme === "light" ? "#1C1C1E" : "#F5F5F7";
  const road = scheme === "light" ? "rgba(23,25,29,0.35)" : "rgba(245,246,247,0.45)";
  const dest = scheme === "light" ? "#3A3A3C" : "#D1D1D6";
  const origin = scheme === "light" ? "#6A7180" : "#8E949E";
  const styleUrl = scheme === "light" ? "mapbox://styles/mapbox/light-v11" : "mapbox://styles/mapbox/dark-v11";
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
    trailColor: trail,
    roadColor: road,
    destColor: dest,
    originColor: origin,
    styleUrl,
  });
  const iconAtZero = JSON.stringify(carMarkerSvg(0));
  const token = JSON.stringify(input.accessToken);

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <link href="https://api.mapbox.com/mapbox-gl-js/v3.9.4/mapbox-gl.css" rel="stylesheet" />
  <script src="https://api.mapbox.com/mapbox-gl-js/v3.9.4/mapbox-gl.js"></script>
  <style>
    html, body, #map { height: 100%; margin: 0; background: ${background}; }
    .mapboxgl-ctrl-logo, .mapboxgl-ctrl-attrib { opacity: 0.55; }
    .car-marker {
      width: 56px;
      height: 56px;
      background-size: contain;
      background-repeat: no-repeat;
      background-position: center;
      will-change: transform;
    }
    .dot-marker {
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
    const token = ${token};
    const state = {
      map: null,
      carMarker: null,
      carEl: null,
      trailSource: null,
      routeSource: null,
      originMarker: null,
      destMarker: null,
      deviceMarker: null,
      follow: snapshot.follow,
      heading: snapshot.heading || 0,
      iconHeading: null,
      lastPan: 0,
      ready: false,
      queued: null,
      raf: 0,
      display: { lat: snapshot.position.latitude, lng: snapshot.position.longitude, heading: snapshot.heading || 0 },
      target: { lat: snapshot.position.latitude, lng: snapshot.position.longitude, heading: snapshot.heading || 0 }
    };

    function post(message) {
      if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify(message));
      else if (window.parent && window.parent !== window) window.parent.postMessage(message, "*");
    }

    function lngLat(point) {
      return [point.longitude, point.latitude];
    }

    function lineFeature(points) {
      return {
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
          coordinates: (points || []).map(lngLat)
        }
      };
    }

    function carIconUrl(heading) {
      const svg = iconTemplate.replace("rotate(0 48 48)", "rotate(" + heading + " 48 48)");
      return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg);
    }

    function makeDot(color, size) {
      const el = document.createElement("div");
      el.className = "dot-marker";
      el.style.width = size + "px";
      el.style.height = size + "px";
      el.style.background = color;
      return el;
    }

    function wrap(delta) {
      let value = delta;
      while (value > 180) value -= 360;
      while (value < -180) value += 360;
      return value;
    }

    function setCarVisual(lat, lng, heading) {
      if (!state.carMarker || !state.carEl) return;
      state.carMarker.setLngLat([lng, lat]);
      const rounded = Math.round(heading);
      if (state.iconHeading === null || Math.abs(rounded - state.iconHeading) >= 4) {
        state.iconHeading = rounded;
        state.carEl.style.backgroundImage = "url(\\"" + carIconUrl(heading) + "\\")";
      }
    }

    function tick() {
      state.raf = 0;
      if (!state.carMarker) return;
      const dLat = state.target.lat - state.display.lat;
      const dLng = state.target.lng - state.display.lng;
      const dH = wrap(state.target.heading - state.display.heading);
      const jump = Math.abs(dLat) > 0.02 || Math.abs(dLng) > 0.02;
      const step = snapshot.reduceMotion || jump ? 1 : 0.22;
      state.display.lat += dLat * step;
      state.display.lng += dLng * step;
      state.display.heading += dH * step;
      setCarVisual(state.display.lat, state.display.lng, state.display.heading);
      const done =
        Math.abs(state.target.lat - state.display.lat) < 0.00001 &&
        Math.abs(state.target.lng - state.display.lng) < 0.00001 &&
        Math.abs(wrap(state.target.heading - state.display.heading)) < 0.4;
      if (!done) state.raf = requestAnimationFrame(tick);
    }

    function kick() {
      if (!state.raf) state.raf = requestAnimationFrame(tick);
    }

    function apply(data) {
      if (typeof data === "string") {
        try { data = JSON.parse(data); } catch (error) { return; }
      }
      if (!data || !data.position || !state.ready) {
        if (data && !state.ready) state.queued = data;
        return;
      }
      const position = { lat: data.position.latitude, lng: data.position.longitude };
      const previous = state.display;
      const jumped = Math.abs(previous.lat - position.lat) > 0.02 || Math.abs(previous.lng - position.lng) > 0.02;
      state.target = { lat: position.lat, lng: position.lng, heading: data.heading || 0 };
      kick();
      if (state.trailSource) {
        state.trailSource.setData(lineFeature(data.trail || []));
      }
      if (data.route && data.route.length && state.routeSource) {
        state.routeSource.setData(lineFeature(data.route));
        if (state.originMarker) state.originMarker.setLngLat(lngLat(data.route[0]));
        if (state.destMarker) state.destMarker.setLngLat(lngLat(data.route[data.route.length - 1]));
      }
      if (data.deviceFix) {
        state.deviceMarker.setLngLat(lngLat(data.deviceFix));
        state.deviceMarker.getElement().style.display = "block";
      } else {
        state.deviceMarker.getElement().style.display = "none";
      }
      state.follow = data.follow;
      if (data.follow) {
        const now = Date.now();
        if (jumped || now - state.lastPan > 1500) {
          state.lastPan = now;
          state.map.easeTo({
            center: [position.lng, position.lat - 0.0032],
            zoom: jumped ? 15 : state.map.getZoom(),
            duration: snapshot.reduceMotion ? 0 : 700
          });
        }
      }
    }

    window.updateRide = apply;

    function initMap() {
      if (!window.mapboxgl) {
        post({ type: "auth" });
        return;
      }
      mapboxgl.accessToken = token;
      const position = lngLat(snapshot.position);
      const center = snapshot.follow
        ? [snapshot.position.longitude, snapshot.position.latitude - 0.0032]
        : position;

      try {
        state.map = new mapboxgl.Map({
          container: "map",
          style: snapshot.styleUrl,
          center: center,
          zoom: 15,
          attributionControl: true,
          logoPosition: "bottom-left",
          pitchWithRotate: false,
          dragRotate: false,
          touchPitch: false
        });
      } catch (error) {
        post({ type: "auth" });
        return;
      }

      state.map.on("error", function (event) {
        const status = event && event.error && event.error.status;
        if (status === 401 || status === 403) post({ type: "auth" });
      });

      state.map.on("load", function () {
        state.map.addSource("route", { type: "geojson", data: lineFeature(snapshot.route) });
        state.map.addSource("trail", { type: "geojson", data: lineFeature(snapshot.trail || []) });
        state.routeSource = state.map.getSource("route");
        state.trailSource = state.map.getSource("trail");

        state.map.addLayer({
          id: "route-line",
          type: "line",
          source: "route",
          paint: {
            "line-color": snapshot.roadColor,
            "line-width": 3,
            "line-opacity": 0.85
          }
        });
        state.map.addLayer({
          id: "trail-line",
          type: "line",
          source: "trail",
          paint: {
            "line-color": snapshot.trailColor,
            "line-width": 4,
            "line-opacity": 0.95
          }
        });

        state.originMarker = new mapboxgl.Marker({ element: makeDot(snapshot.originColor, 10), anchor: "center" })
          .setLngLat(lngLat(snapshot.origin))
          .addTo(state.map);
        state.destMarker = new mapboxgl.Marker({ element: makeDot(snapshot.destColor, 14), anchor: "center" })
          .setLngLat(lngLat(snapshot.destination))
          .addTo(state.map);

        const deviceEl = makeDot("#7EB6FF", 12);
        deviceEl.style.display = snapshot.deviceFix ? "block" : "none";
        state.deviceMarker = new mapboxgl.Marker({ element: deviceEl, anchor: "center" })
          .setLngLat(snapshot.deviceFix ? lngLat(snapshot.deviceFix) : position)
          .addTo(state.map);

        state.carEl = document.createElement("div");
        state.carEl.className = "car-marker";
        state.carEl.style.backgroundImage = "url(\\"" + carIconUrl(snapshot.heading || 0) + "\\")";
        state.carEl.addEventListener("click", function () { post({ type: "vehicle" }); });
        state.carMarker = new mapboxgl.Marker({ element: state.carEl, anchor: "center" })
          .setLngLat(position)
          .addTo(state.map);
        state.iconHeading = Math.round(snapshot.heading || 0);

        state.map.on("dragstart", function () { post({ type: "pan" }); });
        state.ready = true;
        if (state.queued) apply(state.queued);
        post({ type: "ready" });
      });
    }

    if (window.mapboxgl) initMap();
    else {
      post({ type: "auth" });
    }
  </script>
</body>
</html>`;
}
