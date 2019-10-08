import * as React from 'react';
import classNames from 'classnames';
import './dashboard.scss';

const Dashboard: React.FC<DashboardProps> = ({ className, children }) => (
  <div className={classNames('co-dashboard-body', className)}>{children}</div>
);

export default Dashboard;

type DashboardProps = {
  className?: string;
  children: React.ReactNode;
};
