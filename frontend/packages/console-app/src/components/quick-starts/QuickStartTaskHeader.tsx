import * as React from 'react';
import cx from 'classnames';
import { Title, WizardNavItem } from '@patternfly/react-core';
import { CheckCircleIcon, TimesCircleIcon } from '@patternfly/react-icons';
import { TaskStatus } from './utils/quick-start-status';
import './QuickStartTaskHeader.scss';

type QuickStartTaskHeaderProps = {
  title: string;
  taskIndex: number;
  subtitle?: string;
  taskStatus?: TaskStatus;
  size?: 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  isActiveTask?: boolean;
  onTaskSelect: (index: number) => void;
};

const TaskIcon: React.FC<{ taskIndex; taskStatus; isActiveTask }> = ({
  taskIndex,
  taskStatus,
  isActiveTask,
}) => {
  if (isActiveTask) {
    return (
      <span className="co-icon-and-text__icon co-quick-start-task-header__task-icon-init">
        {taskIndex}
      </span>
    );
  }
  switch (taskStatus) {
    case TaskStatus.SUCCESS:
      return (
        <span className="co-icon-and-text__icon">
          <CheckCircleIcon size="md" className="co-quick-start-task-header__task-icon-success" />
        </span>
      );
    case TaskStatus.FAILED:
      return (
        <span className="co-icon-and-text__icon">
          <TimesCircleIcon size="md" className="co-quick-start-task-header__task-icon-failed" />
        </span>
      );
    default:
      return (
        <span className="co-icon-and-text__icon co-quick-start-task-header__task-icon-init">
          {taskIndex}
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
}) => (
  <div className="co-quick-start-task-header">
    <WizardNavItem
      content={
        <>
          <Title
            headingLevel="h3"
            size={size}
            className={cx('co-quick-start-task-header__title', {
              'co-quick-start-task-header__title-success':
                taskStatus === TaskStatus.SUCCESS && !isActiveTask,
              'co-quick-start-task-header__title-failed':
                taskStatus === TaskStatus.FAILED && !isActiveTask,
            })}
          >
            <TaskIcon taskIndex={taskIndex} taskStatus={taskStatus} isActiveTask={isActiveTask} />
            {title}
          </Title>
          {isActiveTask && subtitle && (
            <Title
              headingLevel="h6"
              size="md"
              className="text-secondary "
              style={{ display: 'inline-block' }}
            >
              {subtitle}
            </Title>
          )}
        </>
      }
      step={taskIndex}
      onNavItemClick={onTaskSelect}
      navItemComponent="Button"
    />
  </div>
);

export default QuickStartTaskHeader;
