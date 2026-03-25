import type { FC } from 'react';
import { css } from '@patternfly/react-styles';
import { StatusIcon } from '@patternfly/react-topology/dist/esm/pipelines';
import { useTranslation } from 'react-i18next';
import { ComputedStatus } from '@console/shipwright-plugin/src/components/logs/log-snippet-types';
import { getRunStatusColor } from './reducer';
import type { StepStatus } from './types';

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

export const PipelineVisualizationStepList: FC<PipelineVisualizationStepListProps> = ({
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
          {t('devconsole~Finally task')}
        </div>
      )}
      {steps.map(({ duration, name, status }) => {
        return (
          <div
            className={css('odc-pipeline-visualization-step-list__step', {
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
