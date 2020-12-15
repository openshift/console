import * as React from 'react';
import SvgDropShadowFilter from '../../svg/SvgDropShadowFilter';

export const NODE_SHADOW_FILTER_ID = 'NodeShadowsFilterId';
export const NODE_SHADOW_FILTER_ID_HOVER = 'NodeShadowsFilterId--hover';

const NodeShadows: React.FC = () => (
  <>
    <SvgDropShadowFilter id={NODE_SHADOW_FILTER_ID} />
    <SvgDropShadowFilter
      id={NODE_SHADOW_FILTER_ID_HOVER}
      dy={3}
      stdDeviation={7}
      floodOpacity={0.24}
    />
  </>
);

export { NodeShadows };
