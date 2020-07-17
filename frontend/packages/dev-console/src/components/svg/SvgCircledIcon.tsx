import * as React from 'react';
import { useSize, createSvgIdUrl } from '@patternfly/react-topology';
import { isValidUrl } from '@console/shared';
import { getImageForIconClass } from '@console/internal/components/catalog/catalog-item-icon';
import SvgDropShadowFilter from './SvgDropShadowFilter';

interface SvgTypedIconProps {
  className?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  padding?: number;
  iconClass: string;
}

const FILTER_ID = 'SvgTypedIconDropShadowFilterId';

export const CircledIcon: React.FC<SvgTypedIconProps> = (
  { className, x, y, width, height, iconClass, padding = 4 },
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
        ref={circleRef}
        filter={createSvgIdUrl(FILTER_ID)}
        cx={x - iconWidth / 2}
        cy={y + iconHeight / 2}
        r={iconWidth / 2 + padding}
      />
      <g ref={typedIconRef}>
        <image
          x={x - iconWidth}
          y={y}
          width={width}
          height={height}
          xlinkHref={isValidUrl(iconClass) ? iconClass : getImageForIconClass(iconClass)}
          filter={createSvgIdUrl(FILTER_ID)}
        />
      </g>
    </g>
  );
};

export default React.forwardRef(CircledIcon);
