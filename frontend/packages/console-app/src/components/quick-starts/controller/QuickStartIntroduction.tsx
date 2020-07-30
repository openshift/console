import * as React from 'react';
import { SyncMarkdownView } from '@console/internal/components/markdown-view';
import { QuickStartTask, QuickStartTaskStatus } from '../utils/quick-start-types';
import TaskHeader from './QuickStartTaskHeader';

type QuickStartIntroductionProps = {
  introduction: string;
  tasks: QuickStartTask[];
  allTaskStatuses: QuickStartTaskStatus[];
  onTaskSelect: (selectedTaskNumber: number) => void;
};

const QuickStartIntroduction: React.FC<QuickStartIntroductionProps> = ({
  tasks,
  introduction,
  allTaskStatuses,
  onTaskSelect,
}) => (
  <>
    <SyncMarkdownView content={introduction} />
    <p style={{ marginBottom: 'var(--pf-global--spacer--md)' }}>
      In this tour, you will complete {tasks.length} tasks:
    </p>
    {tasks.map((task, index) => (
      <TaskHeader
        key={task.title}
        title={task.title}
        taskIndex={index + 1}
        size="md"
        taskStatus={allTaskStatuses[index]}
        onTaskSelect={onTaskSelect}
      />
    ))}
  </>
);

export default QuickStartIntroduction;
