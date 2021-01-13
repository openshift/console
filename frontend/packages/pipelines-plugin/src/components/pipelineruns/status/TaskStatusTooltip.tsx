import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { TaskStatus, runStatus, getRunStatusColor } from '../../../utils/pipeline-augment';
import './TaskStatusTooltip.scss';

interface TaskStatusToolTipProps {
  taskStatus: TaskStatus;
}

const TaskStatusToolTip: React.FC<TaskStatusToolTipProps> = ({ taskStatus }) => {
  const { t } = useTranslation();
  return (
    <div className="odc-task-status-tooltip">
      {Object.keys(runStatus).map((status) => {
        const { message, pftoken } = getRunStatusColor(status, t);
        return taskStatus[status] ? (
          <React.Fragment key={status}>
            <div
              className="odc-task-status-tooltip__legend"
              style={{ background: pftoken.value }}
            />
            <div>
              {status === runStatus.PipelineNotStarted || status === runStatus.FailedToStart
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
