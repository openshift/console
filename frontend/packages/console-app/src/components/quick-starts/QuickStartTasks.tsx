import * as React from 'react';
import cx from 'classnames';
import { Alert, Radio } from '@patternfly/react-core';
import { QuickStartTaskItem } from './utils/quick-start-typings';
import { TaskStatus } from './utils/quick-start-status';
import { SyncMarkdownView } from '@console/internal/components/markdown-view';
import TaskHeader from './QuickStartTaskHeader';
import './QuickStartTasks.scss';

type QuickStartTaskProps = {
  tasks: QuickStartTaskItem[];
  taskStatus: TaskStatus[];
  activeTaskIndex: number;
  reviewCallback: (reviewState: boolean) => void;
  onTaskSelect: (index) => void;
};

const QuickStartTasks: React.FC<QuickStartTaskProps> = ({
  tasks,
  taskStatus,
  activeTaskIndex,
  reviewCallback,
  onTaskSelect,
}) => (
  <>
    {tasks
      .filter((_, index) => index <= activeTaskIndex)
      .map((task, index) => {
        const { title, description, review, recapitulation, taskHelp } = task;
        const currTaskStatus = taskStatus[index];
        const isActiveTask = index === activeTaskIndex;
        return (
          <React.Fragment key={task.title}>
            <TaskHeader
              taskIndex={index + 1}
              title={title}
              subtitle={`${index + 1} of ${tasks.length}`}
              taskStatus={currTaskStatus}
              isActiveTask={isActiveTask}
              onTaskSelect={onTaskSelect}
            />
            <SyncMarkdownView
              styles="div {overflow-y: visible !important}"
              content={
                isActiveTask
                  ? description
                  : currTaskStatus === TaskStatus.SUCCESS
                  ? recapitulation.success
                  : recapitulation.failed
              }
            />
            {isActiveTask && currTaskStatus !== TaskStatus.INIT && review && (
              <Alert
                key={`${currTaskStatus}${task.title}`}
                isInline
                variant={
                  currTaskStatus === TaskStatus.SUCCESS
                    ? 'success'
                    : currTaskStatus === TaskStatus.FAILED
                    ? 'danger'
                    : 'info'
                }
                title={
                  <span
                    className={cx({
                      'co-quick-start-task__review-success': currTaskStatus === TaskStatus.SUCCESS,
                      'co-quick-start-task__review-failed': currTaskStatus === TaskStatus.FAILED,
                    })}
                  >
                    Check your work
                  </span>
                }
              >
                <SyncMarkdownView content={review} styles="div {overflow-y: visible !important}" />
                <span className="co-quick-start-task__radio-button-group">
                  <Radio
                    name="review-affirmative"
                    onChange={() => reviewCallback(true)}
                    label="Yes"
                    id="review-affirmative"
                    isChecked={currTaskStatus === TaskStatus.SUCCESS}
                    className="co-quick-start-task__radio-button-field"
                  />
                  <Radio
                    name="review-negative"
                    onChange={() => reviewCallback(false)}
                    label="No"
                    id="review-negative"
                    isChecked={currTaskStatus === TaskStatus.FAILED}
                    className="co-quick-start-task__radio-button-field"
                  />
                </span>
                {currTaskStatus === TaskStatus.FAILED && taskHelp && <h5>{taskHelp}</h5>}
              </Alert>
            )}
          </React.Fragment>
        );
      })}
  </>
);
export default QuickStartTasks;
