import * as React from 'react';
import Dashboard from '@console/shared/src/components/dashboard/Dashboard';
import DashboardGrid from '@console/shared/src/components/dashboard/DashboardGrid';
import { K8sResourceKind, PodKind } from '@console/internal/module/k8s';
import { VMKind, VMIKind } from '../../types';
import {
  VMDetailsCard,
  VMInventoryCard,
  VMStatusCard,
  VMActivityCard,
  VMUtilizationCard,
} from '../dashboards-page/vm-dashboard';
import { VMDashboardContext } from './vm-dashboard-context';

const mainCards = [{ Card: VMStatusCard }, { Card: VMUtilizationCard }];
const leftCards = [{ Card: VMDetailsCard }, { Card: VMInventoryCard }];
const rightCards = [{ Card: VMActivityCard }];

export const VMDashboard: React.FC<VMDashboardProps> = (props) => {
  const { obj: vm, vmi, pods, migrations } = props;

  const context = {
    vm,
    vmi,
    pods,
    migrations,
  };

  return (
    <VMDashboardContext.Provider value={context}>
      <Dashboard>
        <DashboardGrid mainCards={mainCards} leftCards={leftCards} rightCards={rightCards} />
      </Dashboard>
    </VMDashboardContext.Provider>
  );
};

type VMDashboardProps = {
  obj?: VMKind;
  vmi?: VMIKind;
  pods?: PodKind[];
  migrations?: K8sResourceKind[];
};
