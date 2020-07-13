import * as React from 'react';
import { Button } from '@patternfly/react-core';
import { ArrowRightIcon } from '@patternfly/react-icons';
import { QuickStartTaskItem } from './utils/quick-start-typings';
import { SyncMarkdownView } from '@console/internal/components/markdown-view';
import TaskHeader from './QuickStartTaskHeader';
import { TaskStatus } from './utils/quick-start-status';

type QuickStartConclusionProps = {
  tasks: QuickStartTaskItem[];
  taskStatus: TaskStatus[];
  conclusion: string;
  nextQuickStart?: string;
  launchNextQuickStart?: () => void;
  onTaskSelect: (index) => void;
};

const QuickStartConclusion: React.FC<QuickStartConclusionProps> = ({
  tasks,
  taskStatus,
  conclusion,
  nextQuickStart,
  launchNextQuickStart,
  onTaskSelect,
}) => {
  return (
    <>
      {tasks.map((task, index) => (
        <TaskHeader
          key={task.title}
          title={task.title}
          taskIndex={index + 1}
          size="md"
          taskStatus={taskStatus[index]}
          onTaskSelect={onTaskSelect}
        />
      ))}
      <SyncMarkdownView content={conclusion} styles="div {overflow-y: visible !important}" />
      {nextQuickStart && (
        <Button variant="link" onClick={launchNextQuickStart}>
          {`Start ${nextQuickStart} quick start`}
          <ArrowRightIcon />
        </Button>
      )}
    </>
  );
};
export default QuickStartConclusion;
