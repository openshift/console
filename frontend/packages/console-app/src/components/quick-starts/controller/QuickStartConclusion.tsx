import * as React from 'react';
import { Button } from '@patternfly/react-core';
import { ArrowRightIcon } from '@patternfly/react-icons';
import { SyncMarkdownView } from '@console/internal/components/markdown-view';
import { QuickStartTask, QuickStartTaskStatus } from '../utils/quick-start-types';
import TaskHeader from './QuickStartTaskHeader';

type QuickStartConclusionProps = {
  tasks: QuickStartTask[];
  taskStatus: QuickStartTaskStatus[];
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
