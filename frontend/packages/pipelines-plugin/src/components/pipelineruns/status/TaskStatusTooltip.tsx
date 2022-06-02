import * as React from 'react';
import { ComputedStatus } from '../../../types';
import { TaskStatus, getRunStatusColor } from '../../../utils/pipeline-augment';
import './TaskStatusTooltip.scss';

interface TaskStatusToolTipProps {
  taskStatus: TaskStatus;
}

const TaskStatusToolTip: React.FC<TaskStatusToolTipProps> = ({ taskStatus }) => {
  return (
    <div className="odc-task-status-tooltip">
      {Object.keys(ComputedStatus).map((status) => {
        const { message, pftoken } = getRunStatusColor(status);
        return taskStatus[status] ? (
          <React.Fragment key={status}>
            <div
              className="odc-task-status-tooltip__legend"
              style={{ background: pftoken.value }}
            />
            <div>
              {status === ComputedStatus.PipelineNotStarted ||
              status === ComputedStatus.FailedToStart
                ? message
                : `${taskStatus[status]} ${message}`}
            </div>
          </React.Fragment>
        ) : null;
      })}
    </div>
  );
};

export default TaskStatusToolTip;
