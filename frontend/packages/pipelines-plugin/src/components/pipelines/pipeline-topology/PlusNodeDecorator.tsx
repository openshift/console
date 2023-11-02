import * as React from 'react';
import { Tooltip, TooltipPosition } from '@patternfly/react-core';
import { PlusIcon } from '@patternfly/react-icons/dist/esm/icons/plus-icon';
import { BUILDER_NODE_ADD_RADIUS } from './const';

import './PlusNodeDecorator.scss';

type PlusNodeProps = {
  x: number;
  y: number;
  tooltip: string;
  tooltipPosition?: TooltipPosition;
  onClick?: () => void;
};

const PlusNodeDecorator: React.FC<PlusNodeProps> = ({
  x,
  y,
  onClick,
  tooltip,
  tooltipPosition,
}) => {
  const iconRef = React.useRef();
  return (
    <Tooltip triggerRef={iconRef} content={tooltip} position={tooltipPosition}>
      <g
        className="odc-plus-node-decorator"
        onClick={onClick}
        transform={`translate(${x}, ${y})`}
        ref={iconRef}
      >
        <circle
          cx={0}
          cy={0}
          r={BUILDER_NODE_ADD_RADIUS}
          className="odc-plus-node-decorator__circle"
        />
        <g transform="translate(-6, -6)">
          <PlusIcon color="white" />
        </g>
      </g>
    </Tooltip>
  );
};

export default PlusNodeDecorator;
