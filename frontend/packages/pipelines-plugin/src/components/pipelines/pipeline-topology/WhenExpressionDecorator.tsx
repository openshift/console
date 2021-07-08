import * as React from 'react';
import { Tooltip } from '@patternfly/react-core';
import { global_BorderColor_100 as lightBorderColor } from '@patternfly/react-tokens/dist/js/global_BorderColor_100';
import { useTranslation } from 'react-i18next';
import { runStatus } from '../../../utils/pipeline-augment';
import { NODE_HEIGHT } from './const';

import './WhenExpressionDecorator.scss';

type WhenExpressionDecoratorProps = {
  width: number;
  height: number;
  color: string;
  leftOffset?: number;
  stroke?: string;
  status?: string;
  appendLine?: boolean;
  enableTooltip?: boolean;
};

const WhenExpressionDecorator: React.FC<WhenExpressionDecoratorProps> = ({
  width,
  height,
  color,
  enableTooltip,
  stroke = lightBorderColor.value,
  appendLine = false,
  status,
  leftOffset = 2,
}) => {
  const { t } = useTranslation();
  const rotation = 45; // 45deg
  const diamondHeight =
    Math.round(width * Math.sin(rotation)) + Math.round(height * Math.cos(rotation));
  const diamondNode = (
    <g transform={`translate(-${width * leftOffset}, ${NODE_HEIGHT / 2 - diamondHeight / 2})`}>
      <rect
        data-test="diamond-decorator"
        className="opp-when-expression-decorator-diamond"
        width={width}
        height={height}
        fill={color}
        stroke={stroke}
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
  let tooltipContent;
  switch (status) {
    case runStatus.Succeeded:
      tooltipContent = t('pipelines-plugin~When expression was met');
      break;
    case runStatus.Skipped:
      tooltipContent = t('pipelines-plugin~When expression was not met');
      break;
    default:
      tooltipContent = t('pipelines-plugin~When expression');
  }

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
