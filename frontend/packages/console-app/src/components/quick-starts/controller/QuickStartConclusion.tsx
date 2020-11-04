import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@patternfly/react-core';
import { ArrowRightIcon } from '@patternfly/react-icons';
import { SyncMarkdownView } from '@console/internal/components/markdown-view';
import { QuickStartTask, QuickStartTaskStatus } from '../utils/quick-start-types';
import TaskHeader from './QuickStartTaskHeader';

type QuickStartConclusionProps = {
  tasks: QuickStartTask[];
  conclusion: string;
  allTaskStatuses: QuickStartTaskStatus[];
  nextQuickStart?: string;
  onQuickStartChange: (quickStartid: string) => void;
  onTaskSelect: (selectedTaskNumber: number) => void;
};

const QuickStartConclusion: React.FC<QuickStartConclusionProps> = ({
  tasks,
  conclusion,
  allTaskStatuses,
  nextQuickStart,
  onQuickStartChange,
  onTaskSelect,
}) => {
  const hasFailedTask = allTaskStatuses.includes(QuickStartTaskStatus.FAILED);
  const { t } = useTranslation();
  return (
    <>
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
      <SyncMarkdownView
        content={
          hasFailedTask
            ? t(
                'quickstart~One or more verifications did not pass during this quick start. Revisit the tasks or the help links, and then try again.',
              )
            : conclusion
        }
      />
      {nextQuickStart && !hasFailedTask && (
        <Button variant="link" onClick={() => onQuickStartChange(nextQuickStart)} isInline>
          {t('quickstart~Start {{nextQuickStart}} quick start', { nextQuickStart })}{' '}
          <ArrowRightIcon
            style={{ marginLeft: 'var(--pf-global--spacer--xs)', verticalAlign: 'middle' }}
          />
        </Button>
      )}
    </>
  );
};
export default QuickStartConclusion;
