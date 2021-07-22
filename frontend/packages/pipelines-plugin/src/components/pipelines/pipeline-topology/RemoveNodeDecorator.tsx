import * as React from 'react';
import { Tooltip } from '@patternfly/react-core';
import { TrashIcon } from '@patternfly/react-icons';
import { global_palette_black_500 as greyColor } from '@patternfly/react-tokens';
import { BUILDER_NODE_DECORATOR_RADIUS } from './const';

import './RemoveNodeDecorator.scss';

type RemoveNodeDecoratorProps = {
  content: string;
  x: number;
  y: number;
  removeCallback?: () => void;
};

const RemoveNodeDecorator: React.FC<RemoveNodeDecoratorProps> = ({
  content,
  x,
  y,
  removeCallback = () => {},
}) => {
  return (
    <g
      className="opp-remove-node-decorator"
      transform={`translate(${x}, ${y})`}
      onClick={(e) => {
        e.stopPropagation();
        removeCallback();
      }}
    >
      <circle cx={0} cy={0} r={BUILDER_NODE_DECORATOR_RADIUS} fill={greyColor.value} />
      <g transform="translate(-5, -7)">
        <foreignObject
          width={BUILDER_NODE_DECORATOR_RADIUS * 2}
          height={BUILDER_NODE_DECORATOR_RADIUS * 2}
        >
          <Tooltip content={content}>
            <TrashIcon color="white" />
          </Tooltip>
        </foreignObject>
      </g>
    </g>
  );
};

export default RemoveNodeDecorator;
