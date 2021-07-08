import * as React from 'react';
import { useTranslation } from 'react-i18next';
import QuickStartMarkdownView from '../QuickStartMarkdownView';
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
}) => {
  const { t } = useTranslation();
  return (
    <>
      <QuickStartMarkdownView content={introduction} />
      <p style={{ marginBottom: 'var(--pf-global--spacer--md)' }}>
        {t('console-app~In this quick start, you will complete {{count, number}} task', {
          count: tasks.length,
        })}
        :
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
};

export default QuickStartIntroduction;
