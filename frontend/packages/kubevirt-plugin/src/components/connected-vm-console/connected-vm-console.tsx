import * as React from 'react';
import { K8sResourceKind, PersistentVolumeClaimKind, PodKind } from '@console/internal/module/k8s';
import { PersistentVolumeClaimModel, PodModel, ServiceModel } from '@console/internal/models';
import { getVMStatus } from '../../statuses/vm/vm-status';
import { VMImportKind } from '../../types/vm-import/ovirt/vm-import';
import { V1alpha1DataVolume } from '../../types/vm/disk/V1alpha1DataVolume';
import {
  DataVolumeModel,
  VirtualMachineImportModel,
  VirtualMachineInstanceMigrationModel,
  VirtualMachineInstanceModel,
  VirtualMachineModel,
} from '../../models';
import { VMIKind, VMKind } from '../../types/vm';
import { Firehose, FirehoseResult } from '@console/internal/components/utils';
import { VMConsolesWrapper } from '../vms/vm-console';
import { getLoadedData } from '../../utils';
import { ConsoleEmptyState } from './vm-console-empty-state';
import { ConsoleType } from '../../constants/vm/console-type';

const ConnectedVMConsole: React.FC<ConnectedVMConsoleProps> = ({
  type,
  vm,
  vmis,
  pods,
  migrations,
  pvcs,
  dataVolumes,
  vmImports,
}) => {
  const loadedVM = getLoadedData(vm);
  const loadedVMIs = getLoadedData(vmis);
  const loadedPods = getLoadedData(pods);
  const loadedMigrations = getLoadedData(migrations);
  const loadedPVCs = getLoadedData(pvcs);
  const loadedDataVolumes = getLoadedData(dataVolumes);
  const loadedImports = getLoadedData(vmImports);
  const vmi = loadedVMIs?.[0];

  const vmStatusBundle = getVMStatus({
    vm: loadedVM,
    vmi,
    pods: loadedPods,
    migrations: loadedMigrations,
    pvcs: loadedPVCs,
    dataVolumes: loadedDataVolumes,
    vmImports: loadedImports,
  });

  return (
    <VMConsolesWrapper
      vm={loadedVM}
      vmi={vmi}
      vmStatusBundle={vmStatusBundle}
      pods={loadedPods}
      type={type}
      showOpenInNewWindow={false}
    />
  );
};

type ConnectedVMConsoleProps = {
  type: ConsoleType;
  vm?: FirehoseResult<VMKind>;
  vmis?: FirehoseResult<VMIKind[]>;
  pods?: FirehoseResult<PodKind[]>;
  migrations?: FirehoseResult<K8sResourceKind[]>;
  pvcs?: FirehoseResult<PersistentVolumeClaimKind[]>;
  dataVolumes?: FirehoseResult<V1alpha1DataVolume[]>;
  vmImports?: FirehoseResult<VMImportKind[]>;
  services?: FirehoseResult;
};

const FirehoseVMConsole: React.FC<FirehoseVMConsoleProps> = ({
  type,
  namespace,
  name,
  isKubevirt,
}) => {
  const resources = [
    {
      kind: VirtualMachineModel.kind,
      name,
      namespace,
      prop: 'vm',
    },
    {
      kind: VirtualMachineInstanceModel.kind,
      namespace,
      isList: true,
      prop: 'vmis',
      optional: true,
      fieldSelector: `metadata.name=${name}`,
    },
    {
      kind: PodModel.kind,
      namespace,
      isList: true,
      prop: 'pods',
    },
    {
      kind: VirtualMachineInstanceMigrationModel.kind,
      isList: true,
      namespace,
      prop: 'migrations',
    },
    {
      kind: VirtualMachineImportModel.kind,
      isList: true,
      namespace,
      prop: 'vmImports',
      optional: true,
    },
    {
      kind: PersistentVolumeClaimModel.kind,
      isList: true,
      namespace,
      prop: 'pvcs',
    },
    {
      kind: DataVolumeModel.kind,
      isList: true,
      namespace,
      prop: 'dataVolumes',
    },
    { kind: ServiceModel.kind, namespace, prop: 'services' },
  ];
  return isKubevirt ? (
    <Firehose resources={resources}>
      <ConnectedVMConsole type={type} />
    </Firehose>
  ) : (
    <ConsoleEmptyState isKubevirt={isKubevirt} />
  );
};

type FirehoseVMConsoleProps = {
  type: ConsoleType;
  namespace: string;
  name: string;
  isKubevirt: boolean;
};

export default FirehoseVMConsole;
