import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Tooltip } from '@patternfly/react-core';
import { global_BorderColor_100 as lightBorderColor } from '@patternfly/react-tokens';
import { runStatus } from '../../../utils/pipeline-augment';
import { NODE_HEIGHT } from './const';

import './WhenExpressionDecorator.scss';

type WhenExpressionDecoratorProps = {
  width: number;
  height: number;
  color: string;
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
}) => {
  const { t } = useTranslation();
  const rotation = 45; // 45deg
  const diamondHeight =
    Math.round(width * Math.sin(rotation)) + Math.round(height * Math.cos(rotation));
  const diamondNode = (
    <g transform={`translate(-${width * 2}, ${NODE_HEIGHT / 2 - diamondHeight / 2})`}>
      <rect
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
          x2={width + height}
          y2={diamondHeight / 2}
          stroke={lightBorderColor.value}
        />
      )}
    </g>
  );
  let tooltipContent;
  switch (status) {
    case runStatus.Succeeded:
      tooltipContent = <div>{t('pipelines-plugin~When expression was met')}</div>;
      break;
    case runStatus.Skipped:
      tooltipContent = <div>{t('pipelines-plugin~When expression was not met')}</div>;
      break;
    default:
      tooltipContent = <div>{t('pipelines-plugin~When expression')}</div>;
  }

  return enableTooltip ? (
    <Tooltip position="bottom" enableFlip={false} content={tooltipContent}>
      {diamondNode}
    </Tooltip>
  ) : (
    diamondNode
  );
};

export default WhenExpressionDecorator;
