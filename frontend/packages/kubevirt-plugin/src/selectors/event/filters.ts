import { getName, getNamespace } from '@console/shared';
import { PodModel } from '@console/internal/models';
import { VMIKind, VMKind } from '../../types/vm';
import {
  VirtualMachineInstanceMigrationModel,
  VirtualMachineInstanceModel,
  VirtualMachineModel,
} from '../../models';
import { VIRT_LAUNCHER_POD_PREFIX } from '../../constants/vm';

const vmEventFilter = (vm: VMKind) => ({ kind, namespace, name }: EventFilterProps) =>
  kind === VirtualMachineModel.kind && name === getName(vm) && namespace === getNamespace(vm);

const vmiEventFilter = (vm: VMKind | VMIKind) => ({ kind, namespace, name }: EventFilterProps) =>
  kind === VirtualMachineInstanceModel.kind &&
  name === getName(vm) &&
  namespace === getNamespace(vm);

const launcherPodEventFilter = (vm: VMKind) => {
  const podNameStart = `${VIRT_LAUNCHER_POD_PREFIX}${getName(vm)}-`;

  return ({ kind, namespace, name }: EventFilterProps) =>
    kind === PodModel.kind && namespace === getNamespace(vm) && name.startsWith(podNameStart);
};

const importerPodEventFilter = (vm: VMKind) => ({ kind, namespace, name }: EventFilterProps) => {
  // importer pod example importer-<diskName>-<vmname>-<generatedId>
  // note: diskName and vmname may contain '-' which means pod name should have at least 4 parts
  if (
    kind === PodModel.kind &&
    namespace === getNamespace(vm) &&
    name.startsWith('importer-') &&
    name.split('-').length > 3
  ) {
    const importerDashIndex = name.indexOf('-');
    const diskDashIndex = name.indexOf('-', importerDashIndex + 1);
    const lastDashIndex = name.lastIndexOf('-');
    // try to remove importer- and some part of <diskname>
    const diskAndVmName = name.slice(diskDashIndex + 1, lastDashIndex);
    return diskAndVmName.endsWith(getName(vm));
  }
  return false;
};

const vmiMigrationEventFilter = (vm: VMKind) => ({ kind, namespace, name }: EventFilterProps) =>
  kind === VirtualMachineInstanceMigrationModel.kind &&
  namespace === getNamespace(vm) &&
  name === `${getName(vm)}-migration`;

export const getVmEventsFilters = (vm: VMKind) => [
  vmiEventFilter(vm),
  vmEventFilter(vm),
  launcherPodEventFilter(vm),
  importerPodEventFilter(vm),
  vmiMigrationEventFilter(vm),
];

type EventFilterProps = {
  kind: string;
  namespace: string;
  name: string;
};
