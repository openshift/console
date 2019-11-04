import { getName, getNamespace } from '@console/shared';
import { PodModel } from '@console/internal/models';
import { EventInvolvedObject } from '@console/internal/module/k8s';
import { VMIKind, VMKind } from '../../types/vm';
import {
  VirtualMachineInstanceMigrationModel,
  VirtualMachineInstanceModel,
  VirtualMachineModel,
} from '../../models';
import { VIRT_LAUNCHER_POD_PREFIX } from '../../constants/vm';

type EventFilterFunction = (src: EventInvolvedObject) => boolean;

const vmEventFilter = (vm: VMKind): EventFilterFunction => ({ kind, namespace, name }) =>
  kind === VirtualMachineModel.kind && name === getName(vm) && namespace === getNamespace(vm);

const vmiEventFilter = (vm: VMKind | VMIKind): EventFilterFunction => ({ kind, namespace, name }) =>
  kind === VirtualMachineInstanceModel.kind &&
  name === getName(vm) &&
  namespace === getNamespace(vm);

const launcherPodEventFilter = (vm: VMKind): EventFilterFunction => {
  const podNameStart = `${VIRT_LAUNCHER_POD_PREFIX}${getName(vm)}-`;

  return ({ kind, namespace, name }) =>
    kind === PodModel.kind && namespace === getNamespace(vm) && name.startsWith(podNameStart);
};

const importerPodEventFilter = (vm: VMKind): EventFilterFunction => ({ kind, namespace, name }) => {
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

const vmiMigrationEventFilter = (vm: VMKind): EventFilterFunction => ({ kind, namespace, name }) =>
  kind === VirtualMachineInstanceMigrationModel.kind &&
  namespace === getNamespace(vm) &&
  name === `${getName(vm)}-migration`;

// Conversion pod name example: kubevirt-v2v-conversion-[vmName]-<generatedId>
const V2V_CONVERSION_POD_NAME_PREFIX = 'kubevirt-v2v-conversion-';
const v2vConversionPodEventFilter = (vm: VMKind): EventFilterFunction => ({
  kind,
  namespace,
  name,
}) => {
  /* Idea for improvement:
       Find the conversion pod via provided event.involvedObject.uid and check it's ownerReference to VirtualMachine vm. 
       This way, we would avoid false-positive matching which is possible when comparing just by name as implemented bellow.
     When this can happen:
       Conversion is started, the VM deleted and a new conversion for a VM of the same name is created again. The events will be merged together in that case.
     Why not implemented properly now:
       The list of pods is not available and it would be costly to fetch it just for the purpose of this comparision.
       Please note, the conversion is one-time and occasional action and the list of events is for the last hour only.
       If there is any other reason to fetch list of pods, fix here as described above.
  */
  if (
    kind === PodModel.kind &&
    namespace === getNamespace(vm) &&
    name.startsWith(V2V_CONVERSION_POD_NAME_PREFIX)
  ) {
    const nameWithRandom = name.slice(V2V_CONVERSION_POD_NAME_PREFIX.length);
    const lastDashIndex = nameWithRandom.lastIndexOf('-');
    const vmName = nameWithRandom.slice(0, lastDashIndex);
    return vmName === getName(vm);
  }
  return false;
};

export const getVmEventsFilters = (vm: VMKind): EventFilterFunction[] => [
  vmiEventFilter(vm),
  vmEventFilter(vm),
  launcherPodEventFilter(vm),
  importerPodEventFilter(vm),
  vmiMigrationEventFilter(vm),
  v2vConversionPodEventFilter(vm),
];
