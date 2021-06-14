import * as React from 'react';
import { Button } from '@patternfly/react-core';
import { ArrowRightIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';
import QuickStartMarkdownView from '../QuickStartMarkdownView';
import { QuickStartTask, QuickStartTaskStatus, QuickStart } from '../utils/quick-start-types';
import TaskHeader from './QuickStartTaskHeader';

type QuickStartConclusionProps = {
  tasks: QuickStartTask[];
  conclusion: string;
  allTaskStatuses: QuickStartTaskStatus[];
  nextQuickStart?: QuickStart;
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
  const nextQSDisplayName = nextQuickStart?.spec?.displayName;

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
      <QuickStartMarkdownView
        content={
          hasFailedTask
            ? t(
                'quickstart~One or more verifications did not pass during this quick start. Revisit the tasks or the help links, and then try again.',
              )
            : conclusion
        }
      />
      {nextQuickStart && !hasFailedTask && (
        <Button
          variant="link"
          onClick={() => onQuickStartChange(nextQuickStart.metadata.name)}
          isInline
        >
          {t('quickstart~Start {{nextQSDisplayName}} quick start', { nextQSDisplayName })}{' '}
          <ArrowRightIcon
            style={{ marginLeft: 'var(--pf-global--spacer--xs)', verticalAlign: 'middle' }}
          />
        </Button>
      )}
    </>
  );
};
export default QuickStartConclusion;
