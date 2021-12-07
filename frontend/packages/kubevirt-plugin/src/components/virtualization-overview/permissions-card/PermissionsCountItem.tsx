import * as React from 'react';

import './virt-overview-permissions-card.scss';

type PermissionsCountItemProps = {
  count: number;
  Icon: any;
  isLoading: boolean;
};

export const PermissionsCountItem: React.FC<PermissionsCountItemProps> = ({
  count,
  Icon,
  isLoading,
}) => {
  if (isLoading) {
    return <span className="skeleton-inventory" />;
  }
  return (
    <div className="kv-permissions-card__count-item">
      <span>{count}</span>
      <span className="co-dashboard-icon kv-permissions-card__count-icon">{<Icon />}</span>
    </div>
  );
};
