import * as React from 'react';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import { ComputedStatus } from '../../../../types';
import { getRunStatusColor } from '../../../../utils/pipeline-augment';
import { StepStatus } from './pipeline-step-utils';
import { StatusIcon } from './StatusIcon';

import './PipelineVisualizationStepList.scss';

export interface PipelineVisualizationStepListProps {
  isSpecOverview: boolean;
  taskName: string;
  steps: StepStatus[];
  isFinallyTask?: boolean;
  hideHeader?: boolean;
}

const TooltipColoredStatusIcon = ({ status }) => {
  const size = 18;
  const sharedProps = {
    height: size,
    width: size,
  };

  const icon = <StatusIcon status={status} {...sharedProps} />;

  if (status === ComputedStatus.Succeeded || status === ComputedStatus.Failed) {
    // Succeeded and Failed icons have transparent centers shapes - in tooltips, this becomes an undesired black
    // This will simply wrap the icon and place a white backdrop
    return (
      <div style={{ color: getRunStatusColor(status).pftoken.value }}>
        <svg {...sharedProps}>
          <circle
            className="odc-pipeline-visualization-step-list__icon-backdrop"
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
  isFinallyTask,
  hideHeader,
}) => {
  const { t } = useTranslation();
  return (
    <div className="odc-pipeline-visualization-step-list">
      {!hideHeader && (
        <div className="odc-pipeline-visualization-step-list__task-name">{taskName}</div>
      )}
      {isFinallyTask && (
        <div className="odc-pipeline-visualization-step-list__task-type">
          {t('pipelines-plugin~Finally task')}
        </div>
      )}
      {steps.map(({ duration, name, status }) => {
        return (
          <div
            className={classNames('odc-pipeline-visualization-step-list__step', {
              'odc-pipeline-visualization-step-list__step--task-run': !isSpecOverview,
            })}
            key={name}
          >
            {!isSpecOverview ? (
              <div className="odc-pipeline-visualization-step-list__icon">
                <TooltipColoredStatusIcon status={status} />
              </div>
            ) : (
              <span className="odc-pipeline-visualization-step-list__bullet">&bull;</span>
            )}
            <div className="odc-pipeline-visualization-step-list__name">{name}</div>
            {!isSpecOverview && (
              <div className="odc-pipeline-visualization-step-list__duration">{duration}</div>
            )}
          </div>
        );
      })}
    </div>
  );
};
