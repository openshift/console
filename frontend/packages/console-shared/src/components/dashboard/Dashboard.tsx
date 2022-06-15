import * as React from 'react';
import classNames from 'classnames';
import { OverviewProps } from '@console/dynamic-plugin-sdk';
import './dashboard.scss';

/**
 * @deprecated use OverviewPage from @openshift-console/plugin-shared
 */
const Dashboard: React.FC<OverviewProps> = ({ className, children }) => (
  <div data-test-id="dashboard" className={classNames('co-dashboard-body', className)}>
    {children}
  </div>
);

export default Dashboard;
