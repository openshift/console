import * as React from 'react';
import { Tooltip } from '@patternfly/react-core';
import { InProgressIcon } from '@patternfly/react-icons';
import { global_BackgroundColor_light_100 as white } from '@patternfly/react-tokens';
import { BUILDER_NODE_DECORATOR_RADIUS } from './const';

import './InstallingNodeDecorator.scss';

type InstallingNodeDecoratorProps = {
  content: string;
  x: number;
  y: number;
};
const InstallingNodeDecorator: React.FC<InstallingNodeDecoratorProps> = ({ content, x, y }) => {
  return (
    <g
      className="opp-installing-node-decorator "
      transform={`translate(${x}, ${y})`}
      onClick={(e) => {
        e.stopPropagation();
      }}
    >
      <circle cx={0} cy={0} r={BUILDER_NODE_DECORATOR_RADIUS} fill={white.value} />
      <g transform="translate(-5, -7)">
        <foreignObject
          width={BUILDER_NODE_DECORATOR_RADIUS * 2}
          height={BUILDER_NODE_DECORATOR_RADIUS * 2}
        >
          <Tooltip content={content}>
            <InProgressIcon className="fa-spin" />
          </Tooltip>
        </foreignObject>
      </g>
    </g>
  );
};

export default InstallingNodeDecorator;
