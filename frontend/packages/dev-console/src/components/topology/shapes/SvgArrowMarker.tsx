import * as React from 'react';
import SvgDefs from '../../svg/SvgDefs';

type SvgArrowMarkerProps = {
  id: string;
  nodeSize: number;
  markerSize: number;
  className?: string;
};

const SvgArrowMarker: React.FC<SvgArrowMarkerProps> = ({ id, nodeSize, markerSize, className }) => (
  <SvgDefs id={id}>
    <marker
      id={id}
      markerWidth={markerSize}
      markerHeight={markerSize}
      refX={nodeSize / 2 + markerSize}
      refY={markerSize / 2}
      orient="auto"
      markerUnits="userSpaceOnUse"
    >
      <path d={`M0,0 L0,${markerSize} L${markerSize},${markerSize / 2} z`} className={className} />
    </marker>
  </SvgDefs>
);

export default SvgArrowMarker;
