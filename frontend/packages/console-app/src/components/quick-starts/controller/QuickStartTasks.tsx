import * as React from 'react';
import cx from 'classnames';
import { Alert, Radio } from '@patternfly/react-core';
import { SyncMarkdownView } from '@console/internal/components/markdown-view';
import { QuickStartTask, QuickStartTaskStatus } from '../utils/quick-start-types';
import TaskHeader from './QuickStartTaskHeader';
import './QuickStartTasks.scss';

type QuickStartTaskProps = {
  tasks: QuickStartTask[];
  taskStatus: QuickStartTaskStatus[];
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
                  : currTaskStatus === QuickStartTaskStatus.SUCCESS
                  ? recapitulation.success
                  : recapitulation.failed
              }
            />
            {isActiveTask && currTaskStatus !== QuickStartTaskStatus.INIT && review && (
              <Alert
                key={`${currTaskStatus}${task.title}`}
                isInline
                variant={
                  currTaskStatus === QuickStartTaskStatus.SUCCESS
                    ? 'success'
                    : currTaskStatus === QuickStartTaskStatus.FAILED
                    ? 'danger'
                    : 'info'
                }
                title={
                  <span
                    className={cx({
                      'co-quick-start-task__review-success':
                        currTaskStatus === QuickStartTaskStatus.SUCCESS,
                      'co-quick-start-task__review-failed':
                        currTaskStatus === QuickStartTaskStatus.FAILED,
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
                    isChecked={currTaskStatus === QuickStartTaskStatus.SUCCESS}
                    className="co-quick-start-task__radio-button-field"
                  />
                  <Radio
                    name="review-negative"
                    onChange={() => reviewCallback(false)}
                    label="No"
                    id="review-negative"
                    isChecked={currTaskStatus === QuickStartTaskStatus.FAILED}
                    className="co-quick-start-task__radio-button-field"
                  />
                </span>
                {currTaskStatus === QuickStartTaskStatus.FAILED && taskHelp && <h5>{taskHelp}</h5>}
              </Alert>
            )}
          </React.Fragment>
        );
      })}
  </>
);
export default QuickStartTasks;
