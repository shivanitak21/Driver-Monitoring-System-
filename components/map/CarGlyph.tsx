import Svg, { Ellipse, G, Path } from "react-native-svg";

import { carShapes } from "@/components/map/carArt";

type Props = {
  width?: number;
  height?: number;
};

export function CarGlyph({ width = 64, height = 64 }: Props) {
  const spun = carShapes.filter((shape) => shape.spin);
  const ground = carShapes.filter((shape) => !shape.spin);

  return (
    <Svg width={width} height={height} viewBox="0 0 96 96">
      {ground.map((shape, index) =>
        shape.kind === "ellipse" ? (
          <Ellipse key={`g-${index}`} cx={shape.cx} cy={shape.cy} rx={shape.rx} ry={shape.ry} fill={shape.fill} />
        ) : null,
      )}
      <G>
        {spun.map((shape, index) =>
          shape.kind === "path" ? (
            <Path
              key={`p-${index}`}
              d={shape.d}
              fill={shape.fill}
              stroke={shape.stroke}
              strokeWidth={shape.strokeWidth}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ) : null,
        )}
      </G>
    </Svg>
  );
}
