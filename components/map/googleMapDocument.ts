import { darkMapStyle } from "@/constants/mapStyle";
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
};

export function buildGoogleMapHtml(input: MapDocumentInput) {
  const snapshot = JSON.stringify({
    route: input.route,
    origin: input.origin,
    destination: input.destination,
    position: input.position,
    heading: input.heading,
    trail: input.trail,
    deviceFix: input.deviceFix,
    follow: input.follow,
    style: darkMapStyle,
  });

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <style>
    html, body, #map { height: 100%; margin: 0; background: #07080A; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    const snapshot = ${snapshot};
    const state = { map: null, car: null, trail: null, device: null, follow: snapshot.follow, heading: null, lastPan: 0, ready: false, queued: null };

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
      const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="84" height="84" viewBox="0 0 84 84"><g transform="translate(25,13) rotate(' + heading + ' 17 29)"><rect x="4" y="16" width="3.2" height="8" rx="1.2" fill="#242A30"/><rect x="26.8" y="16" width="3.2" height="8" rx="1.2" fill="#242A30"/><rect x="4" y="34" width="3.2" height="8" rx="1.2" fill="#242A30"/><rect x="26.8" y="34" width="3.2" height="8" rx="1.2" fill="#242A30"/><rect x="7" y="6" width="20" height="46" rx="8" fill="#161A1E" stroke="#D6F25C" stroke-width="1.25"/><rect x="10" y="11" width="14" height="13" rx="3" fill="#9BE7E3"/><rect x="10" y="30" width="14" height="12" rx="2.5" fill="#0C0F12"/><rect x="15.2" y="46" width="3.6" height="2.2" rx="0.6" fill="#D6F25C"/></g></svg>';
      return {
        url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg),
        scaledSize: new google.maps.Size(84, 84),
        anchor: new google.maps.Point(42, 42),
      };
    }

    function dot(color, scale) {
      return {
        path: google.maps.SymbolPath.CIRCLE,
        scale: scale,
        fillColor: color,
        fillOpacity: 1,
        strokeColor: "#07080A",
        strokeWeight: 2,
      };
    }

    function apply(data) {
      if (!state.ready) {
        state.queued = data;
        return;
      }
    const position = latLng(data.position);
    const previous = state.car.getPosition();
    const jumped = previous && (Math.abs(previous.lat() - position.lat) > 0.02 || Math.abs(previous.lng() - position.lng) > 0.02);
    state.car.setPosition(position);
      if (state.heading === null || Math.abs(data.heading - state.heading) > 2) {
        state.heading = data.heading;
        state.car.setIcon(carIcon(data.heading));
      }
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
        state.map.panTo(position);
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
        center: position,
        zoom: 15,
        disableDefaultUI: true,
        gestureHandling: "greedy",
        backgroundColor: "#07080A",
        styles: snapshot.style,
        clickableIcons: false,
      });
      state.routeLine = new google.maps.Polyline({
        path: snapshot.route.map(latLng),
        strokeColor: "rgba(243,240,232,0.35)",
        strokeWeight: 3,
        map: state.map,
      });
      state.trail = new google.maps.Polyline({
        path: (snapshot.trail || []).map(latLng),
        strokeColor: "#D6F25C",
        strokeWeight: 4,
        map: state.map,
      });
      state.originMarker = new google.maps.Marker({ position: latLng(snapshot.origin), icon: dot("#8E8A82", 5), map: state.map, clickable: false });
      state.destMarker = new google.maps.Marker({ position: latLng(snapshot.destination), icon: dot("#8FE3E0", 7), map: state.map, clickable: false });
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
      state.heading = snapshot.heading || 0;
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
