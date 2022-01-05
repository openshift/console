import * as React from 'react';
import { GreenCheckCircleIcon, YellowExclamationTriangleIcon } from '@console/shared';

import './virt-overview-permissions-card.scss';

type PermissionsItemProps = {
  task: string;
  capability: boolean;
  isLoading: boolean;
};

export const PermissionsItem: React.FC<PermissionsItemProps> = ({
  task,
  capability,
  isLoading,
}) => {
  const Icon = capability ? GreenCheckCircleIcon : YellowExclamationTriangleIcon;

  return (
    <div className="kv-permissions-card__popover-item">
      <div className="kv-permissions-card__popover-item-task" data-test="kv-permissions-card-task">
        {task}
      </div>
      {isLoading ? (
        <div className="skeleton-inventory" />
      ) : (
        <div className="co-dashboard-icon" data-test="kv-permissions-card-icon">
          <Icon />
        </div>
      )}
    </div>
  );
};
