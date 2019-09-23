import * as React from 'react';
import { Dashboard, DashboardGrid } from '@console/internal/components/dashboard';
import { K8sResourceKind, PodKind } from '@console/internal/module/k8s';
import { VMKind, VMIKind } from '../../types';
import { VMDetailsCard } from '../dashboards-page/vm-dashboard/vm-details-card';
import { VMDashboardContext } from './vm-dashboard-context';

const mainCards = [];
const leftCards = [{ Card: VMDetailsCard }];
const rightCards = [];

export const VMDashboard: React.FC<VMDashboardProps> = (props) => {
  const { obj: vm, vmi, pods, migrations } = props;

  const context = {
    vm,
    vmi,
    pods,
    migrations,
  };

  return (
    <div className="co-m-pane__body">
      <VMDashboardContext.Provider value={context}>
        <Dashboard>
          <DashboardGrid mainCards={mainCards} leftCards={leftCards} rightCards={rightCards} />
        </Dashboard>
      </VMDashboardContext.Provider>
    </div>
  );
};

type VMDashboardProps = {
  obj?: VMKind;
  vmi?: VMIKind;
  pods?: PodKind[];
  migrations?: K8sResourceKind[];
};
