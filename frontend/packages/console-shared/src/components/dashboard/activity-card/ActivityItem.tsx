import * as React from 'react';
import { Progress, ProgressSize } from '@patternfly/react-core';
import { InProgressIcon } from '@patternfly/react-icons';
import classNames from 'classnames';

export const ActivityProgress: React.FC<ActivityProgressProps> = ({
  title,
  progress,
  children,
}) => (
  <>
    <Progress
      value={progress}
      title={title}
      size={ProgressSize.sm}
      className="co-activity-item__progress"
    />
    <div>{children}</div>
  </>
);

const ActivityItem: React.FC<ActivityItemProps> = ({ children, className }) => (
  <>
    <div className={classNames('co-activity-item', className)}>
      <InProgressIcon className="co-dashboard-icon co-activity-item__icon" />
      {children}
    </div>
  </>
);

export default ActivityItem;

type ActivityItemProps = {
  className?: string;
};

type ActivityProgressProps = {
  title: string;
  progress: number;
};
