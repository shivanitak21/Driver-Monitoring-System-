import { carMarkerSvg } from "@/components/map/carArt";
import { darkMapStyle, lightMapStyle } from "@/constants/mapStyle";
import type { Coordinate } from "@/types/domain";

type MapDocumentInput = {
  apiKey: string;
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

export function buildGoogleMapHtml(input: MapDocumentInput) {
  const scheme = input.scheme;
  const background = scheme === "light" ? "#E4E7EB" : "#101216";
  const trail = scheme === "light" ? "#4C6110" : "#D7F76B";
  const road = scheme === "light" ? "rgba(23,25,29,0.28)" : "rgba(245,246,247,0.38)";
  const dest = scheme === "light" ? "#1F6F6A" : "#8FD4D0";
  const origin = scheme === "light" ? "#6A7180" : "#8E949E";
  const snapshot = JSON.stringify({
    route: input.route,
    origin: input.origin,
    destination: input.destination,
    position: input.position,
    heading: input.heading,
    trail: input.trail,
    deviceFix: input.deviceFix,
    follow: input.follow,
    style: scheme === "light" ? lightMapStyle : darkMapStyle,
    reduceMotion: input.reduceMotion,
    background,
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
  <style>
    html, body, #map { height: 100%; margin: 0; background: ${background}; }
    .gm-style-cc, .gm-style > div > a {
      top: 72px !important;
      bottom: auto !important;
      left: 12px !important;
      right: auto !important;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    const snapshot = ${snapshot};
    const iconTemplate = ${iconAtZero};
    const state = {
      map: null, car: null, trail: null, device: null, routeLine: null, originMarker: null, destMarker: null,
      follow: snapshot.follow, heading: snapshot.heading || 0, iconHeading: null, lastPan: 0, ready: false, queued: null, raf: 0,
      display: { lat: snapshot.position.latitude, lng: snapshot.position.longitude, heading: snapshot.heading || 0 },
      target: { lat: snapshot.position.latitude, lng: snapshot.position.longitude, heading: snapshot.heading || 0 }
    };

    function post(message) {
      if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify(message));
      else if (window.parent && window.parent !== window) window.parent.postMessage(message, "*");
    }

    window.addEventListener("message", function (event) {
      const data = event.data;
      if (!data || data.type !== "ride" || !data.payload) return;
      apply(data.payload);
    });

    function latLng(point) {
      return { lat: point.latitude, lng: point.longitude };
    }

    function carIcon(heading) {
      const svg = iconTemplate.replace("rotate(0 48 48)", "rotate(" + heading + " 48 48)");
      return {
        url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg),
        scaledSize: new google.maps.Size(56, 56),
        anchor: new google.maps.Point(28, 28),
      };
    }

    function dot(color, scale) {
      return {
        path: google.maps.SymbolPath.CIRCLE,
        scale: scale,
        fillColor: color,
        fillOpacity: 1,
        strokeColor: snapshot.background,
        strokeWeight: 2,
      };
    }

    function wrap(delta) {
      let value = delta;
      while (value > 180) value -= 360;
      while (value < -180) value += 360;
      return value;
    }

    function tick() {
      state.raf = 0;
      if (!state.car) return;
      const dLat = state.target.lat - state.display.lat;
      const dLng = state.target.lng - state.display.lng;
      const dH = wrap(state.target.heading - state.display.heading);
      const jump = Math.abs(dLat) > 0.02 || Math.abs(dLng) > 0.02;
      const step = snapshot.reduceMotion || jump ? 1 : 0.22;
      state.display.lat += dLat * step;
      state.display.lng += dLng * step;
      state.display.heading += dH * step;
      state.car.setPosition({ lat: state.display.lat, lng: state.display.lng });
      const rounded = Math.round(state.display.heading);
      if (state.iconHeading === null || Math.abs(rounded - state.iconHeading) >= 4 || jump) {
        state.iconHeading = rounded;
        state.car.setIcon(carIcon(state.display.heading));
      }
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
      if (!data || !data.position || !state.ready) {
        if (data && !state.ready) state.queued = data;
        return;
      }
      if (!state.car || !state.trail) return;
      const position = latLng(data.position);
      const previous = state.display;
      const jumped = Math.abs(previous.lat - position.lat) > 0.02 || Math.abs(previous.lng - position.lng) > 0.02;
      state.target = { lat: position.lat, lng: position.lng, heading: data.heading || 0 };
      kick();
      state.trail.setPath((data.trail || []).map(latLng));
      if (data.route && data.route.length && state.routeLine) {
        const line = data.route.map(latLng);
        state.routeLine.setPath(line);
        if (state.originMarker) state.originMarker.setPosition(line[0]);
        if (state.destMarker) state.destMarker.setPosition(line[line.length - 1]);
      }
      if (data.deviceFix) {
        state.device.setPosition(latLng(data.deviceFix));
        state.device.setMap(state.map);
      } else {
        state.device.setMap(null);
      }
      state.follow = data.follow;
      if (data.follow) {
        const now = Date.now();
        if (jumped || now - state.lastPan > 1500) {
          state.lastPan = now;
          state.map.panTo({ lat: position.lat - 0.0032, lng: position.lng });
          if (jumped) state.map.setZoom(15);
        }
      }
    }

    window.updateRide = apply;

    window.gm_authFailure = function () {
      post({ type: "auth" });
    };

    function initMap() {
      const position = latLng(snapshot.position);
      state.map = new google.maps.Map(document.getElementById("map"), {
        center: snapshot.follow ? { lat: position.lat - 0.0032, lng: position.lng } : position,
        zoom: 15,
        disableDefaultUI: true,
        keyboardShortcuts: false,
        gestureHandling: "greedy",
        backgroundColor: snapshot.background,
        styles: snapshot.style,
        clickableIcons: false,
      });
      state.routeLine = new google.maps.Polyline({
        path: snapshot.route.map(latLng),
        strokeColor: snapshot.roadColor,
        strokeWeight: 3,
        map: state.map,
      });
      state.trail = new google.maps.Polyline({
        path: (snapshot.trail || []).map(latLng),
        strokeColor: snapshot.trailColor,
        strokeWeight: 4,
        map: state.map,
      });
      state.originMarker = new google.maps.Marker({ position: latLng(snapshot.origin), icon: dot(snapshot.originColor, 5), map: state.map, clickable: false });
      state.destMarker = new google.maps.Marker({ position: latLng(snapshot.destination), icon: dot(snapshot.destColor, 7), map: state.map, clickable: false });
      state.device = new google.maps.Marker({ position: position, icon: dot("#7EB6FF", 8), clickable: false, zIndex: 4 });
      if (snapshot.deviceFix) {
        state.device.setPosition(latLng(snapshot.deviceFix));
        state.device.setMap(state.map);
      }
      state.car = new google.maps.Marker({
        position: position,
        map: state.map,
        icon: carIcon(snapshot.heading || 0),
        optimized: false,
        zIndex: 5,
      });
      state.iconHeading = Math.round(snapshot.heading || 0);
      state.car.addListener("click", function () { post({ type: "vehicle" }); });
      state.map.addListener("dragstart", function () { post({ type: "pan" }); });
      state.ready = true;
      if (state.queued) apply(state.queued);
      post({ type: "ready" });
    }

    const script = document.createElement("script");
    script.src = "https://maps.googleapis.com/maps/api/js?key=" + encodeURIComponent(${JSON.stringify(input.apiKey)}) + "&callback=initMap";
    script.async = true;
    script.onerror = function () { post({ type: "auth" }); };
    document.head.appendChild(script);
  </script>
</body>
</html>`;
}
