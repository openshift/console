import * as React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@patternfly/react-core';
import { QuickStartTask, QuickStartStatus, QuickStartTaskStatus } from '../utils/quick-start-types';
import QuickStartIntroduction from './QuickStartIntroduction';
import QuickStartTasks from './QuickStartTasks';
import QuickStartConclusion from './QuickStartConclusion';
import './QuickStartSection.scss';

type QuickStartSectionProps = {
  quickStartStatus: QuickStartStatus;
  introduction: string;
  tasks: QuickStartTask[];
  taskStatus: QuickStartTaskStatus[];
  activeTaskIndex: number;
  conclusion: string;
  nextQuickStart?: string;
  nextCallback?: () => void;
  reviewCallback?: (reviewState: boolean) => void;
  prevCallback?: () => void;
  launchNextQuickStart?: () => void;
  onTaskSelect: (index) => void;
};

enum PrimaryButtonText {
  START = 'Start Tour',
  NEXT = 'Next',
  CLOSE = 'Close',
}

const QuickStartSection: React.FC<QuickStartSectionProps> = ({
  quickStartStatus,
  introduction,
  tasks,
  taskStatus,
  activeTaskIndex,
  conclusion,
  nextQuickStart,
  nextCallback,
  prevCallback,
  reviewCallback,
  launchNextQuickStart,
  onTaskSelect,
}) => {
  const getPrimaryButtonText = (): PrimaryButtonText => {
    if (quickStartStatus === QuickStartStatus.COMPLETE) {
      return PrimaryButtonText.CLOSE;
    }
    if (quickStartStatus === QuickStartStatus.IN_PROGRESS) {
      return PrimaryButtonText.NEXT;
    }
    return PrimaryButtonText.START;
  };

  return (
    <>
      <div className="co-quick-start-section__task-content">
        {quickStartStatus === QuickStartStatus.NOT_STARTED && (
          <QuickStartIntroduction
            tasks={tasks}
            introduction={introduction}
            onTaskSelect={onTaskSelect}
          />
        )}
        {quickStartStatus === QuickStartStatus.IN_PROGRESS && (
          <QuickStartTasks
            tasks={tasks}
            taskStatus={taskStatus}
            activeTaskIndex={activeTaskIndex}
            reviewCallback={reviewCallback}
            onTaskSelect={onTaskSelect}
          />
        )}
        {quickStartStatus === QuickStartStatus.COMPLETE && (
          <QuickStartConclusion
            tasks={tasks}
            taskStatus={taskStatus}
            conclusion={conclusion}
            nextQuickStart={nextQuickStart}
            launchNextQuickStart={launchNextQuickStart}
            onTaskSelect={onTaskSelect}
          />
        )}
      </div>
      <div className="co-quick-start-section__footer">
        <Button
          style={{
            marginRight: 'var(--pf-global--spacer--md)',
          }}
          type="submit"
          variant="primary"
          onClick={nextCallback}
          isInline
        >
          {getPrimaryButtonText()}
        </Button>
        {quickStartStatus !== QuickStartStatus.NOT_STARTED && (
          <Button
            style={{
              marginRight: 'var(--pf-global--spacer--md)',
            }}
            type="submit"
            variant="secondary"
            onClick={prevCallback}
            isInline
          >
            Back
          </Button>
        )}
        {quickStartStatus === QuickStartStatus.COMPLETE && (
          <Link style={{ display: 'inline-block' }} to="/tours">
            View all tours
          </Link>
        )}
      </div>
    </>
  );
};

export default QuickStartSection;
