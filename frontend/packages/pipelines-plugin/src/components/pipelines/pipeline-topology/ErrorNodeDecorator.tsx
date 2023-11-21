import * as React from 'react';
import { Tooltip } from '@patternfly/react-core';
import { ExclamationIcon } from '@patternfly/react-icons/dist/esm/icons/exclamation-icon';
import { global_danger_color_100 as redColor } from '@patternfly/react-tokens/dist/js/global_danger_color_100';
import { BUILDER_NODE_DECORATOR_RADIUS } from './const';

import './ErrorNodeDecorator.scss';

type ErrorNodeDecoratorProps = {
  errorStr: string;
  x: number;
  y: number;
};

const ErrorNodeDecorator: React.FC<ErrorNodeDecoratorProps> = ({ errorStr, x, y }) => {
  const iconRef = React.useRef();
  return (
    <Tooltip triggerRef={iconRef} content={errorStr}>
      <g ref={iconRef} className="odc-error-node-decorator" transform={`translate(${x}, ${y})`}>
        <circle cx={0} cy={0} r={BUILDER_NODE_DECORATOR_RADIUS} fill={redColor.value} />
        <g transform="translate(-5, -6)">
          <ExclamationIcon color="white" />
        </g>
      </g>
    </Tooltip>
  );
};

export default ErrorNodeDecorator;
