import * as React from 'react';
import classNames from 'classnames';

export const Dashboard: React.FC<DashboardProps> = ({ className, children }) => (
  <div className={classNames('co-dashboard-body', className)}>{children}</div>
);

type DashboardProps = {
  className?: string;
  children: React.ReactNode;
};
