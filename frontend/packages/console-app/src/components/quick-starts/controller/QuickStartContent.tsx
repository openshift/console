import * as React from 'react';
import { QuickStartTaskStatus, QuickStart } from '../utils/quick-start-types';
import QuickStartIntroduction from './QuickStartIntroduction';
import QuickStartTasks from './QuickStartTasks';
import QuickStartConclusion from './QuickStartConclusion';

import './QuickStartContent.scss';

type QuickStartContentProps = {
  quickStart: QuickStart;
  taskNumber: number;
  allTaskStatuses: QuickStartTaskStatus[];
  onTaskSelect: (selectedTaskNumber: number) => void;
  onTaskReview: (taskStatus: QuickStartTaskStatus) => void;
  onQuickStartChange?: (quickStartId: string) => void;
};

const QuickStartContent = React.forwardRef<HTMLDivElement, QuickStartContentProps>(
  (
    { quickStart, taskNumber, allTaskStatuses, onTaskSelect, onTaskReview, onQuickStartChange },
    ref,
  ) => {
    const {
      spec: { introduction, tasks, conclusion, nextQuickStart = [] },
    } = quickStart;
    const totalTasks = tasks.length;
    const nextQS = nextQuickStart.length > 0 && nextQuickStart[0];

    return (
      <div className="co-quick-start-content" ref={ref}>
        {taskNumber === -1 && (
          <QuickStartIntroduction
            tasks={tasks}
            allTaskStatuses={allTaskStatuses}
            introduction={introduction}
            onTaskSelect={onTaskSelect}
          />
        )}
        {taskNumber > -1 && taskNumber < totalTasks && (
          <QuickStartTasks
            tasks={tasks}
            taskNumber={taskNumber}
            allTaskStatuses={allTaskStatuses}
            onTaskReview={onTaskReview}
            onTaskSelect={onTaskSelect}
          />
        )}
        {taskNumber === totalTasks && (
          <QuickStartConclusion
            tasks={tasks}
            conclusion={conclusion}
            allTaskStatuses={allTaskStatuses}
            nextQuickStart={nextQS}
            onQuickStartChange={onQuickStartChange}
            onTaskSelect={onTaskSelect}
          />
        )}
      </div>
    );
  },
);

export default QuickStartContent;
