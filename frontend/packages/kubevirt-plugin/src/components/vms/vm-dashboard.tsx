import * as React from 'react';
import Dashboard from '@console/shared/src/components/dashboard/Dashboard';
import DashboardGrid from '@console/shared/src/components/dashboard/DashboardGrid';
import {
  VMDetailsCard,
  VMInventoryCard,
  VMStatusCard,
  VMActivityCard,
  VMUtilizationCard,
} from '../dashboards-page/vm-dashboard';
import { VMDashboardContext } from './vm-dashboard-context';
import { asVM, isVMI, isVM } from '../../selectors/vm/vmlike';
import { VMTabProps } from './types';
import { getVMStatus } from '../../statuses/vm/vm-status';

const mainCards = [{ Card: VMStatusCard }, { Card: VMUtilizationCard }];
const leftCards = [{ Card: VMDetailsCard }, { Card: VMInventoryCard }];
const rightCards = [{ Card: VMActivityCard }];

export const VMDashboard: React.FC<VMTabProps> = (props) => {
  const {
    obj: objProp,
    vm: vmProp,
    vmi: vmiProp,
    pods,
    migrations,
    dataVolumes,
    vmImports,
  } = props;

  const vm = asVM(objProp) || (isVM(vmProp) && vmProp);
  const vmi = (isVMI(objProp) && objProp) || vmiProp;

  const vmStatusBundle = getVMStatus({
    vm,
    vmi,
    pods,
    migrations,
    dataVolumes,
    vmImports,
  });

  const context = {
    vm,
    vmi,
    pods,
    vmStatusBundle,
  };

  return (
    <VMDashboardContext.Provider value={context}>
      <Dashboard>
        <DashboardGrid mainCards={mainCards} leftCards={leftCards} rightCards={rightCards} />
      </Dashboard>
    </VMDashboardContext.Provider>
  );
};
