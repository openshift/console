import * as React from 'react';
import classNames from 'classnames';

const DashboardCardHeader: React.FC<DashboardCardHeaderProps> = React.memo(
  ({ className, children, compact }) => (
    <div
      className={classNames(
        'co-dashboard-card__header',
        { 'co-dashboard-card__header--compact': compact },
        className,
      )}
    >
      {children}
    </div>
  ),
);

export default DashboardCardHeader;

type DashboardCardHeaderProps = {
  className?: string;
  children: React.ReactNode;
  compact?: boolean;
};
