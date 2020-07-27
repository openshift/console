import * as React from 'react';
import { SyncMarkdownView } from '@console/internal/components/markdown-view';
import { QuickStartTask } from '../utils/quick-start-types';
import TaskHeader from './QuickStartTaskHeader';

type QuickStartIntroductionProps = {
  tasks: QuickStartTask[];
  introduction: string;
  onTaskSelect: (index) => void;
};

const QuickStartIntroduction: React.FC<QuickStartIntroductionProps> = ({
  tasks,
  introduction,
  onTaskSelect,
}) => {
  return (
    <>
      <SyncMarkdownView styles="div {overflow-y: visible !important}" content={introduction} />
      <p style={{ marginBottom: 'var(--pf-global--spacer--md)' }}>
        In this tour, you will complete {tasks.length} tasks:
      </p>
      {tasks.map((task, index) => (
        <TaskHeader
          key={task.title}
          title={task.title}
          taskIndex={index + 1}
          size="md"
          onTaskSelect={onTaskSelect}
        />
      ))}
    </>
  );
};
export default QuickStartIntroduction;
