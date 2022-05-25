import * as React from 'react';
import { Tooltip, TooltipPosition } from '@patternfly/react-core';
import { PlusIcon } from '@patternfly/react-icons';
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
  return (
    <Tooltip content={tooltip} position={tooltipPosition}>
      <g className="odc-plus-node-decorator" onClick={onClick} transform={`translate(${x}, ${y})`}>
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
