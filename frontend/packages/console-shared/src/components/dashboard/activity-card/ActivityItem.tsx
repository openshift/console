import * as React from 'react';
import { Progress, ProgressSize } from '@patternfly/react-core';
import { InProgressIcon } from '@patternfly/react-icons';

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

const ActivityItem: React.FC = ({ children }) => (
  <>
    <div className="co-activity-item">
      <InProgressIcon className="co-dashboard-icon" />
      <div className="co-activity-item__title">{children}</div>
    </div>
  </>
);

export default ActivityItem;

type ActivityProgressProps = {
  title: string;
  progress: number;
};
