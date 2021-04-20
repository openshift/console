import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { SectionHeading, ResourceSummary } from '@console/internal/components/utils';
import { TaskModel } from '../../models';
import { TaskKind } from '../../types';
import WorkspaceDefinitionList from '../shared/workspaces/WorkspaceDefinitionList';

import './TaskDetails.scss';

export interface TaskDetailsProps {
  obj: TaskKind;
}

const TaskDetails: React.FC<TaskDetailsProps> = ({ obj: task }) => {
  const { t } = useTranslation();
  return (
    <div className="co-m-pane__body">
      <SectionHeading
        text={t('pipelines-plugin~{{taskLabel}} details', {
          taskLabel: t(TaskModel.labelKey),
        })}
      />
      <div className="row">
        <div className="col-sm-6">
          <ResourceSummary resource={task} />
        </div>
        <div className="col-sm-6 odc-task-details__status">
          <WorkspaceDefinitionList workspaces={task.spec.workspaces} />
        </div>
      </div>
    </div>
  );
};

export default TaskDetails;
