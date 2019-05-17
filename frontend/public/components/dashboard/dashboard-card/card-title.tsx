import * as React from 'react';
import classNames from 'classnames';

export const DashboardCardTitle: React.FC<DashboardCardTitleProps> = React.memo(({ className, children }) => (
  <h2 className={classNames('co-dashboard-card__title', className)}>
    {children}
  </h2>
));

type DashboardCardTitleProps = {
  className?: string;
  children: React.ReactNode;
}
