import * as React from 'react';
import Dashboard from '@console/shared/src/components/dashboard/Dashboard';
import DashboardGrid from '@console/shared/src/components/dashboard/DashboardGrid';
import { isVM, isVMI } from '../../selectors/check-type';
import { asVM } from '../../selectors/vm/vmlike';
import { getVMStatus } from '../../statuses/vm/vm-status';
import {
  VMActivityCard,
  VMDetailsCard,
  VMInventoryCard,
  VMStatusCard,
  VMUtilizationCard,
} from '../dashboards-page/vm-dashboard';
import { VMTabProps } from './types';
import { VMDashboardContext } from './vm-dashboard-context';

const mainCards = [{ Card: VMStatusCard }, { Card: VMUtilizationCard }];
const leftCards = [{ Card: VMDetailsCard }, { Card: VMInventoryCard }];
const rightCards = [{ Card: VMActivityCard }];

export const VMDashboard: React.FC<VMTabProps> = (props) => {
  const {
    obj: objProp,
    vm: vmProp,
    vmis: vmisProp,
    pods,
    migrations,
    pvcs,
    dataVolumes,
    vmImports,
  } = props;

  const vm = asVM(objProp) || (isVM(vmProp) && vmProp);
  const vmi = (isVMI(objProp) && objProp) || vmisProp[0];
  const isVMPage = isVM(objProp);

  const vmStatusBundle = getVMStatus({
    vm,
    vmi,
    pods,
    migrations,
    pvcs,
    dataVolumes,
    vmImports,
  });

  const context = {
    vm,
    vmi,
    isVMPage,
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
