import * as React from 'react';
import { PageSection } from '@patternfly/react-core';
import { OverviewProps } from '@console/dynamic-plugin-sdk';
import './dashboard.scss';

const Dashboard: React.FCC<OverviewProps> = ({ className, children }) => (
  <PageSection data-test-id="dashboard" className={className}>
    {children}
  </PageSection>
);

export default Dashboard;
