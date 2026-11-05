/**
 * Apple Maps–inspired night style with enough contrast that roads stay visible.
 * (Near-black geometry made the Live map look blank.)
 */
export const darkMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#12151A" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8E949E" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#12151A" }] },
  { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#2A3038" }] },
  { featureType: "administrative.land_parcel", stylers: [{ visibility: "off" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#171C19" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#2A3038" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#12151A" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#A1A6AF" }] },
  { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#323840" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#3A414A" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#12151A" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0E1A20" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#6E8B91" }] },
];

/** Soft daylight — pale terrain, white roads. */
export const lightMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#E6E8EB" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#5C6370" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#E6E8EB" }] },
  { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#D5D8DE" }] },
  { featureType: "administrative.land_parcel", stylers: [{ visibility: "off" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#D5E0D4" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#FFFFFF" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#E6E8EB" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#5C6370" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#F7F8F4" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#E6E8EB" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#C9D6DE" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#3E6270" }] },
];
