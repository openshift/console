import * as React from 'react';
import { TaskRunKind } from '../../../types';
import TaskRunsListPage from '../../taskruns/list-page/TaskRunsListPage';

interface TaskRunsProps {
  obj: TaskRunKind;
}

const TaskRuns: React.FC<TaskRunsProps> = ({ obj }) => (
  <TaskRunsListPage
    showTitle={false}
    selector={{ 'tekton.dev/pipelineRun': obj.metadata.name }}
    showPipelineColumn={false}
    namespace={obj.metadata.namespace}
    hideBadge
  />
);

export default TaskRuns;
