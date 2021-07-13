import * as React from 'react';
import classNames from 'classnames';
import { DashboardCardHeaderProps } from '@console/dynamic-plugin-sdk/src/api/internal';

const DashboardCardHeader: React.FC<DashboardCardHeaderProps> = React.memo(
  ({ className, children }) => (
    <div className={classNames('co-dashboard-card__header', className)}>{children}</div>
  ),
);

export default DashboardCardHeader;
