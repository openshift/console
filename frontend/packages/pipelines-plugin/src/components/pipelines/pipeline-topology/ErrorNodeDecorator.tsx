import * as React from 'react';
import { Tooltip } from '@patternfly/react-core';
import { ExclamationIcon } from '@patternfly/react-icons';
import { global_danger_color_100 as redColor } from '@patternfly/react-tokens';
import { BUILDER_NODE_ERROR_RADIUS } from './const';

import './ErrorNodeDecorator.scss';

type ErrorNodeDecoratorProps = {
  errorStr: string;
  x: number;
  y: number;
};

const ErrorNodeDecorator: React.FC<ErrorNodeDecoratorProps> = ({ errorStr, x, y }) => {
  return (
    <g className="odc-error-node-decorator" transform={`translate(${x}, ${y})`}>
      <circle cx={0} cy={0} r={BUILDER_NODE_ERROR_RADIUS} fill={redColor.value} />
      <g transform="translate(-5, -7)">
        <foreignObject width={BUILDER_NODE_ERROR_RADIUS * 2} height={BUILDER_NODE_ERROR_RADIUS * 2}>
          <Tooltip content={errorStr}>
            <ExclamationIcon color="white" />
          </Tooltip>
        </foreignObject>
      </g>
    </g>
  );
};

export default ErrorNodeDecorator;
