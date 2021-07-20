import * as React from 'react';
import { Tooltip } from '@patternfly/react-core';
import { global_BorderColor_100 as lightBorderColor } from '@patternfly/react-tokens/dist/js/global_BorderColor_100';
import { runStatus } from '../../../utils/pipeline-augment';
import { NODE_HEIGHT } from './const';
import { getWhenExpressionDiamondState } from './utils';

import './WhenExpressionDecorator.scss';

type WhenExpressionDecoratorProps = {
  width: number;
  height: number;
  leftOffset?: number;
  stroke?: string;
  status: runStatus;
  appendLine?: boolean;
  enableTooltip?: boolean;
  isFinallyTask: boolean;
  isPipelineRun: boolean;
};

const WhenExpressionDecorator: React.FC<WhenExpressionDecoratorProps> = ({
  width,
  height,
  enableTooltip,
  appendLine = false,
  status,
  leftOffset = 2,
  isFinallyTask,
  isPipelineRun,
}) => {
  const rotation = 45; // 45deg
  const { tooltipContent, diamondColor } = getWhenExpressionDiamondState(
    status,
    isPipelineRun,
    isFinallyTask,
  );
  const diamondHeight =
    Math.round(width * Math.sin(rotation)) + Math.round(height * Math.cos(rotation));
  const diamondNode = (
    <g transform={`translate(-${width * leftOffset}, ${NODE_HEIGHT / 2 - diamondHeight / 2})`}>
      <rect
        data-test="diamond-decorator"
        className="opp-when-expression-decorator-diamond"
        width={width}
        height={height}
        fill={diamondColor}
        stroke={isPipelineRun ? diamondColor : lightBorderColor.value}
      />
      {appendLine && (
        <line
          x1={diamondHeight / 2}
          y1={diamondHeight / 2}
          x2={width * leftOffset}
          y2={diamondHeight / 2}
          stroke={lightBorderColor.value}
        />
      )}
    </g>
  );

  return enableTooltip ? (
    <Tooltip
      position="bottom"
      enableFlip={false}
      content={<div data-test="when-expression-tooltip">{tooltipContent}</div>}
    >
      {diamondNode}
    </Tooltip>
  ) : (
    diamondNode
  );
};

export default WhenExpressionDecorator;
