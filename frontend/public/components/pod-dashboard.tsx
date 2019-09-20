import * as React from 'react';
import { Dashboard, DashboardGrid } from './dashboard';
import { PodKind } from '@console/internal/module/k8s';

export const PodDashboardContext = React.createContext<PodDashboardContext>({ pod: undefined });

const mainCards = [];
const leftCards = [];
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
  obj: PodKind;
};

type PodDashboardContext = {
  pod: PodKind;
};
