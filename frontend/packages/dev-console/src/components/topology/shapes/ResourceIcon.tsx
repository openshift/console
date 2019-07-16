import * as React from 'react';
import { get } from 'lodash';
import { modelFor, kindToAbbr } from '@console/internal/module/k8s';
import './ResourceIcon.scss';

export interface ResourceIconProps {
  x: number;
  y: number;
  kind: string;
}

function useClientRect() {
  const [bb, setbb] = React.useState(null);
  const ref = React.useCallback((node) => {
    if (node !== null) {
      setbb(node.getBoundingClientRect());
    }
  }, []);
  return [bb, ref];
}

export function getKindStringAndAbbrivation(kind: string) {
  const kindObj = modelFor(kind);
  const kindStr = get(kindObj, 'kind', kind);
  const KindAbbr = (kindObj && kindObj.abbr) || kindToAbbr(kindStr);
  return { kindStr, KindAbbr };
}

export const ResourceIcon: React.FC<ResourceIconProps> = ({ kind, x, y }, iconRef) => {
  const { KindAbbr, kindStr } = getKindStringAndAbbrivation(kind);
  const [bb, textRef] = useClientRect();

  let rect = null;
  if (bb) {
    let { height } = bb;
    const paddingX = height / 2;
    const paddingY = height / 14;
    height += paddingY * 2;

    rect = (
      <rect
        ref={iconRef}
        x={x - paddingX - bb.width / 2}
        width={bb.width + paddingX * 2}
        y={y - paddingY - bb.height / 2}
        height={height}
        rx={height / 2}
        ry={height / 2}
      />
    );
  }
  return (
    <g className={`odc-resource-icon odc-resource-icon-${kindStr.toLowerCase()}`}>
      {rect}
      <text ref={textRef} x={x} y={y} textAnchor="middle" dy="0.35em">
        {KindAbbr}
      </text>
    </g>
  );
};

export default React.forwardRef(ResourceIcon);
