import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { SectionHeading, ResourceSummary } from '@console/internal/components/utils';
import { TaskRunModel } from '../../models';
import { TaskRunKind } from '../../types';
import TaskRunDetailsStatus from './TaskRunDetailsStatus';

export interface TaskRunDetailsSectionProps {
  taskRun: TaskRunKind;
}

const TaskRunDetailsSection: React.FC<TaskRunDetailsSectionProps> = ({ taskRun }) => {
  const { t } = useTranslation();
  return (
    <>
      <SectionHeading
        text={t('pipelines-plugin~{{taskRunLabel}} details', {
          taskRunLabel: t(TaskRunModel.labelKey),
        })}
      />
      <div className="row">
        <div className="col-sm-6">
          <ResourceSummary resource={taskRun} />
        </div>
        <div className="col-sm-6 odc-taskrun-details__status">
          <TaskRunDetailsStatus taskRun={taskRun} />
        </div>
      </div>
    </>
  );
};

export default TaskRunDetailsSection;
