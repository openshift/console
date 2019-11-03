import * as React from 'react';
import { get } from 'lodash';
import { useSize } from '@console/topology';
import { modelFor, kindToAbbr } from '@console/internal/module/k8s';
import './ResourceIcon.scss';

export interface ResourceIconProps {
  x: number;
  y: number;
  kind: string;
}

export function getKindStringAndAbbrivation(kind: string) {
  const kindObj = modelFor(kind);
  const kindStr = get(kindObj, 'kind', kind);
  const kindAbbr = (kindObj && kindObj.abbr) || kindToAbbr(kindStr);
  return { kindStr, kindAbbr };
}

export const ResourceIcon: React.FC<ResourceIconProps> = ({ kind, x, y }, iconRef) => {
  const { kindAbbr, kindStr } = getKindStringAndAbbrivation(kind);
  const [textSize, textRef] = useSize([]);

  let rect = null;
  if (textSize) {
    let { height } = textSize;
    const paddingX = height / 2;
    const paddingY = height / 14;
    height += paddingY * 2;

    rect = (
      <rect
        ref={iconRef}
        x={x - paddingX - textSize.width / 2}
        width={textSize.width + paddingX * 2}
        y={y - paddingY - textSize.height / 2}
        height={height}
        rx={height / 2}
        ry={height / 2}
      />
    );
  }
  return (
    <g className={`odc-resource-icon odc-resource-icon-${kindStr.toLowerCase()}`}>
      {rect}
      <title>{kindStr}</title>
      <text ref={textRef} x={x} y={y} textAnchor="middle" dy="0.35em">
        {kindAbbr}
      </text>
    </g>
  );
};

export default React.forwardRef(ResourceIcon);
