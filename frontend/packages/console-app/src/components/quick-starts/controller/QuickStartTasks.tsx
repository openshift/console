import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { SyncMarkdownView } from '@console/internal/components/markdown-view';
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
        .filter((_, index) => index <= taskNumber)
        .map((task, index) => {
          const { title, description, review, recapitulation } = task;
          const isActiveTask = index === taskNumber;
          const taskStatus = allTaskStatuses[index];
          const recapitulationInstructions =
            taskStatus === QuickStartTaskStatus.SUCCESS
              ? recapitulation.success
              : recapitulation.failed;
          const taskInstructions = isActiveTask ? description : recapitulationInstructions;

          return (
            <React.Fragment key={title}>
              <TaskHeader
                taskIndex={index + 1}
                title={title}
                size="md"
                subtitle={t('quickstart~{{index, number}} of {{tasks, number}}', {
                  index: index + 1,
                  tasks: tasks.length,
                })}
                taskStatus={taskStatus}
                isActiveTask={isActiveTask}
                onTaskSelect={onTaskSelect}
              />
              <SyncMarkdownView content={taskInstructions} />
              {isActiveTask && taskStatus !== QuickStartTaskStatus.INIT && review && (
                <QuickStartTaskReview
                  review={review}
                  taskStatus={taskStatus}
                  onTaskReview={onTaskReview}
                />
              )}
            </React.Fragment>
          );
        })}
    </>
  );
};

export default QuickStartTasks;
