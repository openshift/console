import * as React from 'react';
import { useSize, createSvgIdUrl } from '@patternfly/react-topology';
import { getImageForIconClass } from '@console/internal/components/catalog/catalog-item-icon';
import SvgDropShadowFilter from './SvgDropShadowFilter';

interface SvgTypedIconProps {
  className?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  padding?: number;
  iconClass?: string;
  icon?: React.ReactNode;
}

const FILTER_ID = 'SvgTypedIconDropShadowFilterId';

const CircledIcon: React.FC<SvgTypedIconProps> = (
  { className, x, y, width, height, iconClass, icon, padding = 4 },
  circleRef,
) => {
  const [typedIconSize, typedIconRef] = useSize([]);

  let iconWidth = 0;
  let iconHeight = 0;

  if (typedIconSize) {
    ({ width: iconWidth, height: iconHeight } = typedIconSize);
  }

  return (
    <g className={className}>
      <SvgDropShadowFilter id={FILTER_ID} />
      <circle
        key={`circle-${FILTER_ID}`}
        ref={circleRef}
        filter={createSvgIdUrl(FILTER_ID)}
        cx={x - iconWidth / 2}
        cy={y + iconHeight / 2}
        r={iconWidth / 2 + padding}
      />
      {icon ? (
        <g ref={typedIconRef}>
          <foreignObject
            key={`image-${FILTER_ID}`}
            x={x - iconWidth + 4}
            y={y}
            width={width}
            height={height}
          >
            {icon}
          </foreignObject>
        </g>
      ) : (
        <g ref={typedIconRef}>
          <image
            key={`image-${FILTER_ID}`}
            x={x - iconWidth}
            y={y}
            width={width}
            height={height}
            xlinkHref={getImageForIconClass(iconClass) || iconClass}
            filter={createSvgIdUrl(FILTER_ID)}
          />
        </g>
      )}
    </g>
  );
};

export default React.forwardRef(CircledIcon);
