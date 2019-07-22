import * as _ from 'lodash';
import { getName, getNamespace } from '@console/shared';
import { PodModel } from '@console/internal/models';
import { VMIKind, VMKind } from '../../types/vm';
import {
  VirtualMachineInstanceMigrationModel,
  VirtualMachineInstanceModel,
  VirtualMachineModel,
} from '../../models';
import { VIRT_LAUNCHER_POD_PREFIX } from '../../constants/vm';

export const vmEventFilter = (vm: VMKind) => {
  const vmName = getName(vm);
  const vmNamespace = getNamespace(vm);

  return (event) =>
    _.isMatch(event, { name: vmName, namespace: vmNamespace, kind: VirtualMachineModel.kind });
};

export const vmiEventFilter = (vm: VMKind | VMIKind) => {
  const vmName = getName(vm);
  const vmNamespace = getNamespace(vm);

  return (event) =>
    _.isMatch(event, {
      name: vmName,
      namespace: vmNamespace,
      kind: VirtualMachineInstanceModel.kind,
    });
};

export const launcherPodEventFilter = (vm: VMKind) => {
  const podNameStart = `${VIRT_LAUNCHER_POD_PREFIX}${getName(vm)}-`;
  const vmNamespace = getNamespace(vm);

  return ({ kind, namespace, name }) =>
    kind === PodModel.kind && namespace === vmNamespace && name.startsWith(podNameStart);
};

export const importerPodEventFilter = (vm: VMKind) => {
  const vmName = getName(vm);
  const vmNamespace = getNamespace(vm);

  return ({ kind, namespace, name }) => {
    // importer pod example importer-<diskName>-<vmname>-<generatedId>
    // note: diskName and vmname may contain '-' which means pod name should have at least 4 parts
    if (
      kind === PodModel.kind &&
      namespace === vmNamespace &&
      name.startsWith('importer-') &&
      name.split('-').length > 3
    ) {
      const importerDashIndex = name.indexOf('-');
      const diskDashIndex = name.indexOf('-', importerDashIndex + 1);
      const lastDashIndex = name.lastIndexOf('-');
      // try to remove importer- and some part of <diskname>
      const diskAndVmName = name.slice(diskDashIndex + 1, lastDashIndex);
      return diskAndVmName.endsWith(vmName);
    }
    return false;
  };
};

export const vmiMigrationEventFilter = (vm: VMKind) => {
  const vmName = getName(vm);
  const vmNamespace = getNamespace(vm);

  return ({ kind, namespace, name }) =>
    kind === VirtualMachineInstanceMigrationModel.kind &&
    namespace === vmNamespace &&
    name === `${vmName}-migration`;
};
