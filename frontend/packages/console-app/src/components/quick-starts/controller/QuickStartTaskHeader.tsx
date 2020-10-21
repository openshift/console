import * as React from 'react';
import cx from 'classnames';
import { useTranslation } from 'react-i18next';
import { Title, WizardNavItem } from '@patternfly/react-core';
import { CheckCircleIcon, TimesCircleIcon } from '@patternfly/react-icons';
import { QuickStartTaskStatus } from '../utils/quick-start-types';

import './QuickStartTaskHeader.scss';

type QuickStartTaskHeaderProps = {
  title: string;
  taskIndex: number;
  subtitle?: string;
  taskStatus?: QuickStartTaskStatus;
  size?: 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  isActiveTask?: boolean;
  onTaskSelect: (index: number) => void;
};

const TaskIcon: React.FC<{ taskIndex; taskStatus; isActiveTask }> = ({
  taskIndex,
  taskStatus,
  isActiveTask,
}) => {
  const { t } = useTranslation();
  if (isActiveTask) {
    return (
      <span className="co-icon-and-text__icon co-quick-start-task-header__task-icon-init">
        {t('quickstart~{{taskIndex, number}}', { taskIndex })}
      </span>
    );
  }
  switch (taskStatus) {
    case QuickStartTaskStatus.SUCCESS:
      return (
        <span className="co-icon-and-text__icon">
          <CheckCircleIcon size="md" className="co-quick-start-task-header__task-icon-success" />
        </span>
      );
    case QuickStartTaskStatus.FAILED:
      return (
        <span className="co-icon-and-text__icon">
          <TimesCircleIcon size="md" className="co-quick-start-task-header__task-icon-failed" />
        </span>
      );
    default:
      return (
        <span className="co-icon-and-text__icon co-quick-start-task-header__task-icon-init">
          {t('quickstart~{{taskIndex, number}}', { taskIndex })}
        </span>
      );
  }
};

const QuickStartTaskHeader: React.FC<QuickStartTaskHeaderProps> = ({
  title,
  taskIndex,
  subtitle,
  taskStatus,
  size,
  isActiveTask,
  onTaskSelect,
}) => {
  const classNames = cx('co-quick-start-task-header__title', {
    'co-quick-start-task-header__title-success':
      taskStatus === QuickStartTaskStatus.SUCCESS && !isActiveTask,
    'co-quick-start-task-header__title-failed':
      taskStatus === QuickStartTaskStatus.FAILED && !isActiveTask,
  });

  const content = (
    <span className="co-quick-start-task-header">
      <Title headingLevel="h3" size={size} className={classNames}>
        <TaskIcon taskIndex={taskIndex} taskStatus={taskStatus} isActiveTask={isActiveTask} />
        {title}
        {isActiveTask && subtitle && (
          <>
            {' '}
            <small className="co-quick-start-task-header__subtitle text-secondary">
              {subtitle}
            </small>
          </>
        )}
      </Title>
    </span>
  );

  return (
    <div className="co-quick-start-task-header">
      <WizardNavItem
        content={content}
        step={taskIndex}
        onNavItemClick={() => onTaskSelect(taskIndex - 1)}
        navItemComponent="button"
      />
    </div>
  );
};

export default QuickStartTaskHeader;
