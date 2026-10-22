import type { ImageSource } from "expo-image";

export const vehiclePhotos: Array<{
  id: string;
  label: string;
  caption: string;
  source: ImageSource;
}> = [
  {
    id: "exterior",
    label: "Exterior",
    caption: "BMW M5 · Alpine White",
    source: require("../assets/vehicle/exterior-front.jpg"),
  },
  {
    id: "cabin",
    label: "Cabin",
    caption: "BMW M cabin",
    source: require("../assets/vehicle/interior-bmw-2.jpg"),
  },
  {
    id: "cabin-low",
    label: "Cabin",
    caption: "BMW M · low light",
    source: require("../assets/vehicle/interior-bmw.jpg"),
  },
];

export const evidenceStill = vehiclePhotos[1].source;
