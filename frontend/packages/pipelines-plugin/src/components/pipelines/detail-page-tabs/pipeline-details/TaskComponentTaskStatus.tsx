import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { getRunStatusColor } from '../../../../utils/pipeline-augment';
import HorizontalStackedBars, { StackedValue } from '../../../charts/HorizontalStackedBars';
import { StepStatus } from './pipeline-step-utils';

interface TaskStatusProps {
  steps: StepStatus[];
}

const TaskComponentTaskStatus: React.FC<TaskStatusProps> = ({ steps }) => {
  const { t } = useTranslation();
  if (steps.length === 0) return null;

  const visualValues: StackedValue[] = steps.map(({ name, runStatus }) => {
    return {
      color: getRunStatusColor(runStatus, t).pftoken.value,
      name,
      size: 1,
    };
  });

  return <HorizontalStackedBars values={visualValues} barGap={2} height={2} />;
};

export default TaskComponentTaskStatus;
