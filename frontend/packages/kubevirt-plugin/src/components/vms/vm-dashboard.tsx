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
import { asVM, isVMI, isVM } from '../../selectors/vm/vmlike';
import { VMImportKind } from '../../types/vm-import/ovirt/vm-import';

const mainCards = [{ Card: VMStatusCard }, { Card: VMUtilizationCard }];
const leftCards = [{ Card: VMDetailsCard }, { Card: VMInventoryCard }];
const rightCards = [{ Card: VMActivityCard }];

export const VMDashboard: React.FC<VMDashboardProps> = (props) => {
  const { obj: objProp, vm: vmProp, vmi: vmiProp, pods, migrations, vmImports } = props;

  const vm = asVM(objProp) || (isVM(vmProp) && vmProp);
  const vmi = (isVMI(objProp) && objProp) || vmiProp;

  const context = {
    vm,
    vmi,
    pods,
    migrations,
    vmImports,
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
  vm?: VMKind;
  vmi?: VMIKind;
  pods?: PodKind[];
  migrations?: K8sResourceKind[];
  vmImports?: VMImportKind[];
};
