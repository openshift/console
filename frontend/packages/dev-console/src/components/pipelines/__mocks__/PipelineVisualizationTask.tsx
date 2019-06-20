import * as React from 'react';
import { TaskStatusClassNameMap } from '../../../utils/pipeline-utils';

export const PipelineVisualizationTask = ({ task }) => (
  <li className="odc-pipeline-vis-task">
    <span>{task.name}</span>
    {task.status && task.status.reason && (
      <span className={TaskStatusClassNameMap[task.status.reason]}>{task.status.reason}</span>
    )}
    {task.status && task.status.duration && <span>{task.status.duration}</span>}
  </li>
);
