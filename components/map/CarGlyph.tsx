import Svg, { Rect } from "react-native-svg";

type Props = {
  width?: number;
  height?: number;
};

export function CarGlyph({ width = 34, height = 58 }: Props) {
  return (
    <Svg width={width} height={height} viewBox="0 0 34 58">
      <Rect x="4" y="16" width="3.2" height="8" rx="1.2" fill="#242A30" />
      <Rect x="26.8" y="16" width="3.2" height="8" rx="1.2" fill="#242A30" />
      <Rect x="4" y="34" width="3.2" height="8" rx="1.2" fill="#242A30" />
      <Rect x="26.8" y="34" width="3.2" height="8" rx="1.2" fill="#242A30" />
      <Rect x="7" y="6" width="20" height="46" rx="8" fill="#161A1E" stroke="#D6F25C" strokeWidth="1.25" />
      <Rect x="10" y="11" width="14" height="13" rx="3" fill="#9BE7E3" />
      <Rect x="10" y="30" width="14" height="12" rx="2.5" fill="#0C0F12" />
      <Rect x="15.2" y="46" width="3.6" height="2.2" rx="0.6" fill="#D6F25C" />
    </Svg>
  );
}
