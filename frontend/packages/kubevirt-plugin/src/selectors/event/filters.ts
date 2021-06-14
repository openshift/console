import { PodModel } from '@console/internal/models';
import { EventInvolvedObject, EventKind } from '@console/internal/module/k8s';
import { getCreationTimestamp, getName, getNamespace, getUID } from '@console/shared';
import { VIRT_LAUNCHER_POD_PREFIX } from '../../constants/vm';
import {
  VirtualMachineImportModel,
  VirtualMachineInstanceMigrationModel,
  VirtualMachineInstanceModel,
  VirtualMachineModel,
} from '../../models';
import { VMILikeEntityKind } from '../../types/vmLike';

type EventFilterFunction = (src: EventInvolvedObject, event: EventKind) => boolean;

const vmEventFilter = (vm: VMILikeEntityKind): EventFilterFunction => ({ kind, uid }) => {
  return kind === VirtualMachineModel.kind && uid === getUID(vm);
};

// If a VM with a name x is created than started/migrated etc and than deleted again,
// the associated events will keep existing in the system even though the objects which produced them are gone (e.g. the migration object/pod etc).
// Since the event itself does not contain a reference to the VM ID and can only be associated using a VM name,
// the events from the previous VM are mixed into the events of the new VM.
// Since the owner reference to the VM is not present on the event but only the object which produced the event (e.g. migration pod) and this object can be gone
// by now, the only safe way how to filter these events out is to make sure no events which have been produced before the VM was created are shown.
const happenedBeforeVmCreation = (vm: VMILikeEntityKind, timestamp: string): boolean =>
  new Date(timestamp) < new Date(getCreationTimestamp(vm));

const vmiEventFilter = (vm: VMILikeEntityKind): EventFilterFunction => (
  { kind, namespace, name },
  { firstTimestamp },
) =>
  kind === VirtualMachineInstanceModel.kind &&
  name === getName(vm) &&
  namespace === getNamespace(vm) &&
  !happenedBeforeVmCreation(vm, firstTimestamp);

const launcherPodEventFilter = (vm: VMILikeEntityKind): EventFilterFunction => {
  const podNameStart = `${VIRT_LAUNCHER_POD_PREFIX}${getName(vm)}-`;

  return ({ kind, namespace, name }, { firstTimestamp }) =>
    kind === PodModel.kind &&
    namespace === getNamespace(vm) &&
    name.startsWith(podNameStart) &&
    !happenedBeforeVmCreation(vm, firstTimestamp);
};

const cdiImporterPodEventFilter = (vm: VMILikeEntityKind): EventFilterFunction => (
  { kind, namespace, name },
  { firstTimestamp },
) => {
  // importer pod example importer-<vmName>-<diskName>-<generatedId>
  // note: diskName and vmname may contain '-' which means pod name should have at least 4 parts
  if (
    kind === PodModel.kind &&
    namespace === getNamespace(vm) &&
    name.startsWith('importer-') &&
    name.split('-').length > 3
  ) {
    const importerDashIndex = name.indexOf('-');
    const lastDashIndex = name.lastIndexOf('-');
    // remove importer- and -<generatedId>
    const vmAndDiskName = name.slice(importerDashIndex + 1, lastDashIndex);
    return vmAndDiskName.startsWith(getName(vm)) && !happenedBeforeVmCreation(vm, firstTimestamp);
  }
  return false;
};

const vmiMigrationEventFilter = (vm: VMILikeEntityKind): EventFilterFunction => (
  { kind, namespace, name },
  { firstTimestamp },
) =>
  kind === VirtualMachineInstanceMigrationModel.kind &&
  namespace === getNamespace(vm) &&
  name === `${getName(vm)}-migration` &&
  !happenedBeforeVmCreation(vm, firstTimestamp);

// Conversion pod name example: kubevirt-v2v-conversion-[vmName]-<generatedId>
const V2V_CONVERSION_POD_NAME_PREFIX = 'kubevirt-v2v-conversion-';
const v2vConversionPodEventFilter = (vm: VMILikeEntityKind): EventFilterFunction => (
  { kind, namespace, name },
  { firstTimestamp },
) => {
  if (
    kind === PodModel.kind &&
    namespace === getNamespace(vm) &&
    name.startsWith(V2V_CONVERSION_POD_NAME_PREFIX)
  ) {
    const nameWithRandom = name.slice(V2V_CONVERSION_POD_NAME_PREFIX.length);
    const lastDashIndex = nameWithRandom.lastIndexOf('-');
    const vmName = nameWithRandom.slice(0, lastDashIndex);
    return vmName === getName(vm) && !happenedBeforeVmCreation(vm, firstTimestamp);
  }
  return false;
};

const virtualMachineImportEventFilter = (vm: VMILikeEntityKind): EventFilterFunction => (
  { kind, namespace, name },
  { firstTimestamp },
) => {
  if (kind !== VirtualMachineImportModel.kind || namespace !== getNamespace(vm)) {
    return false;
  }

  const lastDashIndex = name.lastIndexOf('-');
  const vmImportName = name.slice(0, lastDashIndex);
  return (
    vmImportName === `vm-import-${getName(vm)}` && happenedBeforeVmCreation(vm, firstTimestamp)
  );
};

export const getVmEventsFilters = (vm: VMILikeEntityKind): EventFilterFunction[] => [
  vmiEventFilter(vm),
  vmEventFilter(vm),
  launcherPodEventFilter(vm),
  cdiImporterPodEventFilter(vm),
  vmiMigrationEventFilter(vm),
  v2vConversionPodEventFilter(vm),
  virtualMachineImportEventFilter(vm),
];
