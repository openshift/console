import * as React from 'react';
import {
  DashboardCard,
  DashboardCardTitle,
  DashboardCardBody,
  DashboardCardHeader,
} from '@console/internal/components/dashboard/dashboard-card';

export const FooCard: React.FC<{}> = () => (
  <DashboardCard>
    <DashboardCardHeader>
      <DashboardCardTitle>Foo Card</DashboardCardTitle>
    </DashboardCardHeader>
    <DashboardCardBody>
      <div>foo content</div>
    </DashboardCardBody>
  </DashboardCard>
);
