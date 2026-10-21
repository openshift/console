import type { FC } from 'react';
import { PageSection } from '@patternfly/react-core';
import type { OverviewProps } from '@console/dynamic-plugin-sdk';
import './dashboard.scss';

const Dashboard: FC<OverviewProps> = ({ className, children }) => (
  <PageSection data-test-id="dashboard" className={className}>
    {children}
  </PageSection>
);

export default Dashboard;
