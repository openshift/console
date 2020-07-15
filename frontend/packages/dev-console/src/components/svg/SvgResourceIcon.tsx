import * as React from 'react';
import cx from 'classnames';
import { get } from 'lodash';
import { useSize } from '@patternfly/react-topology';
import { modelFor, kindToAbbr } from '@console/internal/module/k8s';
import './SvgResourceIcon.scss';

interface ResourceIconProps {
  x: number;
  y: number;
  kind: string;
  leftJustified?: boolean;
}

function getKindStringAndAbbreviation(kind: string) {
  const kindObj = modelFor(kind);
  const kindStr = get(kindObj, 'kind', kind);
  const kindColor = get(kindObj, 'color', undefined);
  const kindAbbr = (kindObj && kindObj.abbr) || kindToAbbr(kindStr);
  return { kindStr, kindAbbr, kindColor };
}

const ForwardSvgResourceIcon: React.FC<ResourceIconProps> = (
  { kind, x, y, leftJustified },
  iconRef,
) => {
  const { kindAbbr, kindStr, kindColor } = getKindStringAndAbbreviation(kind);
  const [textSize, textRef] = useSize([]);

  let rect = null;
  let paddingX = 0;
  let paddingY = 0;
  let width = 0;
  let height = 0;

  if (textSize) {
    ({ height, width } = textSize);
    paddingX = height / 2;
    paddingY = height / 14;
    height += paddingY * 2;
    rect = (
      <rect
        fill={kindColor}
        ref={iconRef}
        x={x - (leftJustified ? 0 : paddingX + width / 2)}
        width={textSize.width + paddingX * 2}
        y={y - (leftJustified ? 0 : paddingY + textSize.height / 2)}
        height={height}
        rx={height / 2}
        ry={height / 2}
      />
    );
  }

  return (
    <g
      className={cx('odc-resource-icon', {
        [`odc-resource-icon-${kindStr.toLowerCase()}`]: !kindColor,
      })}
    >
      {rect}
      <title>{kindStr}</title>
      <text
        ref={textRef}
        x={x + (leftJustified ? paddingX + width / 2 : 0)}
        y={y + (leftJustified ? (paddingY + height) / 2 : 0)}
        textAnchor="middle"
        dy="0.35em"
      >
        {kindAbbr}
      </text>
    </g>
  );
};

const SvgResourceIcon = React.forwardRef(ForwardSvgResourceIcon);
export { SvgResourceIcon, getKindStringAndAbbreviation };
