import * as React from 'react';
import classNames from 'classnames';
import { getRunStatusColor, runStatus } from '../../../../utils/pipeline-augment';
import { StatusIcon } from './StatusIcon';
import { StepStatus } from './pipeline-step-utils';

import './PipelineVisualizationStepList.scss';

export interface PipelineVisualizationStepListProps {
  isSpecOverview: boolean;
  taskName: string;
  steps: StepStatus[];
}

const TooltipColoredStatusIcon = ({ status }) => {
  const size = 18;
  const sharedProps = {
    height: size,
    width: size,
  };

  const icon = <StatusIcon status={status} {...sharedProps} />;

  if (status === runStatus.Succeeded || status === runStatus.Failed) {
    // Succeeded and Failed icons have transparent centers shapes - in tooltips, this becomes an undesired black
    // This will simply wrap the icon and place a white backdrop
    return (
      <div style={{ color: getRunStatusColor(status).pftoken.value }}>
        <svg {...sharedProps}>
          <circle
            className="odc-pipeline-vis-steps-list__icon-backdrop"
            cx={size / 2}
            cy={size / 2}
            r={size / 2 - 1}
          />
          {icon}
        </svg>
      </div>
    );
  }

  return icon;
};

export const PipelineVisualizationStepList: React.FC<PipelineVisualizationStepListProps> = ({
  isSpecOverview,
  taskName,
  steps,
}) => (
  <div className="odc-pipeline-vis-steps-list">
    <div className="odc-pipeline-vis-steps-list__task-name">{taskName}</div>
    {steps.map(({ duration, name, runStatus: status }) => {
      return (
        <div
          className={classNames('odc-pipeline-vis-steps-list__step', {
            'odc-pipeline-vis-steps-list__step--task-run': !isSpecOverview,
          })}
          key={name}
        >
          {!isSpecOverview ? (
            <div className="odc-pipeline-vis-steps-list__icon">
              <TooltipColoredStatusIcon status={status} />
            </div>
          ) : (
            <span className="odc-pipeline-vis-steps-list__bullet">&bull;</span>
          )}
          <div className="odc-pipeline-vis-steps-list__name">{name}</div>
          {!isSpecOverview && (
            <div className="odc-pipeline-vis-steps-list__duration">{duration}</div>
          )}
        </div>
      );
    })}
  </div>
);
