import * as React from 'react';
import { useTranslation } from 'react-i18next';
import QuickStartMarkdownView from '../QuickStartMarkdownView';
import { QUICKSTART_TASKS_INITIAL_STATES } from '../utils/const';
import { QuickStartTask, QuickStartTaskStatus } from '../utils/quick-start-types';
import TaskHeader from './QuickStartTaskHeader';
import QuickStartTaskReview from './QuickStartTaskReview';

type QuickStartTaskProps = {
  tasks: QuickStartTask[];
  taskNumber: number;
  allTaskStatuses: QuickStartTaskStatus[];
  onTaskReview: (reviewState: QuickStartTaskStatus) => void;
  onTaskSelect: (activeQuickStartId) => void;
};

const QuickStartTasks: React.FC<QuickStartTaskProps> = ({
  tasks,
  taskNumber,
  allTaskStatuses,
  onTaskReview,
  onTaskSelect,
}) => {
  const { t } = useTranslation();
  return (
    <>
      {tasks
        .filter((_, index) => allTaskStatuses[index] !== QuickStartTaskStatus.INIT)
        .map((task, index) => {
          const { title, description, review } = task;
          const isActiveTask = index === taskNumber;
          const taskStatus = allTaskStatuses[index];

          return (
            <React.Fragment key={title}>
              <TaskHeader
                taskIndex={index + 1}
                title={title}
                size="md"
                subtitle={t('console-app~{{index, number}} of {{tasks, number}}', {
                  index: index + 1,
                  tasks: tasks.length,
                })}
                taskStatus={taskStatus}
                isActiveTask={isActiveTask}
                onTaskSelect={onTaskSelect}
              />
              {isActiveTask && (
                <div style={{ marginBottom: 'var(--pf-global--spacer--md)' }}>
                  <QuickStartMarkdownView content={description} />
                  {!QUICKSTART_TASKS_INITIAL_STATES.includes(taskStatus) && review && (
                    <QuickStartTaskReview
                      review={review}
                      taskStatus={taskStatus}
                      onTaskReview={onTaskReview}
                    />
                  )}
                </div>
              )}
            </React.Fragment>
          );
        })}
    </>
  );
};

export default QuickStartTasks;
