import * as React from 'react';
import { QuickStartStatus, QuickStartTaskStatus, QuickStart } from '../utils/quick-start-types';
import QuickStartIntroduction from './QuickStartIntroduction';
import QuickStartTasks from './QuickStartTasks';
import QuickStartConclusion from './QuickStartConclusion';

import './QuickStartContent.scss';

type QuickStartContentProps = {
  quickStart: QuickStart;
  status: QuickStartStatus;
  taskNumber: number;
  allTaskStatuses: QuickStartTaskStatus[];
  onTaskSelect: (selectedTaskNumber: number) => void;
  onTaskReview: (taskStatus: QuickStartTaskStatus) => void;
  onQuickStartChange?: (quickStartId: string) => void;
};

const QuickStartContent: React.FC<QuickStartContentProps> = ({
  quickStart,
  status,
  taskNumber,
  allTaskStatuses,
  onTaskSelect,
  onTaskReview,
  onQuickStartChange,
}) => {
  const { introduction, tasks, conclusion, nextQuickStart } = quickStart;

  return (
    <div className="co-quick-start-content">
      {status === QuickStartStatus.NOT_STARTED && (
        <QuickStartIntroduction
          tasks={tasks}
          introduction={introduction}
          onTaskSelect={onTaskSelect}
        />
      )}
      {status === QuickStartStatus.IN_PROGRESS && (
        <QuickStartTasks
          tasks={tasks}
          taskNumber={taskNumber}
          allTaskStatuses={allTaskStatuses}
          onTaskReview={onTaskReview}
          onTaskSelect={onTaskSelect}
        />
      )}
      {status === QuickStartStatus.COMPLETE && (
        <QuickStartConclusion
          tasks={tasks}
          conclusion={conclusion}
          allTaskStatuses={allTaskStatuses}
          nextQuickStart={nextQuickStart}
          onQuickStartChange={onQuickStartChange}
          onTaskSelect={onTaskSelect}
        />
      )}
    </div>
  );
};

export default QuickStartContent;
