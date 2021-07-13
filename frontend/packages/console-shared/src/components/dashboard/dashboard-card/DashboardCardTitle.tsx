import * as React from 'react';
import classNames from 'classnames';
import { DashboardCardTitleProps } from '@console/dynamic-plugin-sdk/src/api/internal';

const DashboardCardTitle: React.FC<DashboardCardTitleProps> = React.memo(
  ({ className, children }) => (
    <h2
      data-test="dashboard-card-title"
      className={classNames('co-dashboard-card__title', className)}
    >
      {children}
    </h2>
  ),
);

export default DashboardCardTitle;
