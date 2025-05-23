import * as React from 'react';
import { Progress, ProgressSize } from '@patternfly/react-core';
import { InProgressIcon } from '@patternfly/react-icons/dist/esm/icons/in-progress-icon';
import { css } from '@patternfly/react-styles';
import { ActivityItemProps } from '@console/dynamic-plugin-sdk/src/api/internal-types';

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
    <div className={css('co-activity-item', className)}>
      <InProgressIcon className="co-dashboard-icon co-activity-item__icon" />
      {children}
    </div>
  </>
);

export default ActivityItem;

type ActivityProgressProps = {
  title: string;
  progress: number;
};
