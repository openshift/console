import * as React from 'react';
import { Tooltip } from '@patternfly/react-core';
import { InProgressIcon } from '@patternfly/react-icons/dist/esm/icons/in-progress-icon';
import { BUILDER_NODE_DECORATOR_RADIUS } from './const';

import './InstallingNodeDecorator.scss';

type InstallingNodeDecoratorProps = {
  content: string;
  x: number;
  y: number;
};
const InstallingNodeDecorator: React.FC<InstallingNodeDecoratorProps> = ({ content, x, y }) => {
  const iconRef = React.useRef();
  return (
    <Tooltip triggerRef={iconRef} content={content}>
      <g
        ref={iconRef}
        className="opp-installing-node-decorator"
        transform={`translate(${x}, ${y})`}
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <circle
          cx={0}
          cy={0}
          r={BUILDER_NODE_DECORATOR_RADIUS}
          className="opp-installing-node-decorator__circle"
        />
        <g transform="translate(-5, -7)">
          <InProgressIcon className="fa-spin" />
        </g>
      </g>
    </Tooltip>
  );
};

export default InstallingNodeDecorator;
