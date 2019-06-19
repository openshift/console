import * as React from 'react';
import { getImageForIconClass } from '@console/internal/components/catalog/catalog-item-icon';
import SvgDefs from '../../svg/SvgDefs';
import { createSvgIdUrl } from '../../../utils/svg-utils';

type KnativeIconProps = {
  x: number;
  y: number;
  width: number;
  height: number;
};

const FILTER_ID = 'KnativeIconOutlineFilterId';

const KnativeIcon: React.FC<KnativeIconProps> = ({ x, y, width, height }) => (
  <React.Fragment>
    <SvgDefs id={FILTER_ID}>
      <filter id={FILTER_ID}>
        <feOffset result="nw" in="SourceAlpha" dx="-0.5" dy="-0.5" />
        <feOffset result="ne" in="SourceAlpha" dx="0.5" dy="-0.5" />
        <feOffset result="se" in="SourceAlpha" dx="0.5" dy="0.5" />
        <feOffset result="sw" in="SourceAlpha" dx="-0.5" dy="0.5" />
        <feMerge result="blackborder">
          <feMergeNode in="nw" />
          <feMergeNode in="ne" />
          <feMergeNode in="se" />
          <feMergeNode in="sw" />
        </feMerge>
        <feFlood floodColor="#FFFFFF" />
        <feComposite in2="blackborder" operator="in" result="offsetColor" />
        <feMerge>
          <feMergeNode in="offsetColor" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </SvgDefs>
    <image
      x={x}
      y={y}
      width={width}
      height={height}
      xlinkHref={getImageForIconClass('icon-knative')}
      filter={createSvgIdUrl(FILTER_ID)}
    />
  </React.Fragment>
);

export default React.memo(KnativeIcon);
