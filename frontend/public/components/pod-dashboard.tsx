import * as React from 'react';
import { PodKind } from '../module/k8s';
import { Dashboard, DashboardGrid } from './dashboard';
import { PodDashboardDetailsCard } from './pod-dashboard-details';
import { PodDashboardContext } from './pod-dashboard-context';

const mainCards = [];
const leftCards = [{ Card: PodDashboardDetailsCard }];
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
