import * as React from 'react';
import Dashboard from '@console/shared/src/components/dashboard/Dashboard';
import DashboardGrid from '@console/shared/src/components/dashboard/DashboardGrid';
import { PodKind } from '../../../module/k8s';
import { DetailsCard } from './details-card';
import { PodDashboardContext } from './pod-dashboard-context';

const mainCards = [];
const leftCards = [{ Card: DetailsCard }];
const rightCards = [];

export const PodDashboard: React.FC<PodDashboardProps> = (props) => {
  const { obj: pod } = props;
  const context = { pod };
  return (
    <div className="co-m-pane__body">
      <PodDashboardContext.Provider value={context}>
        <Dashboard>
          <DashboardGrid mainCards={mainCards} leftCards={leftCards} rightCards={rightCards} />
        </Dashboard>
      </PodDashboardContext.Provider>
    </div>
  );
};

type PodDashboardProps = {
  obj?: PodKind;
};
