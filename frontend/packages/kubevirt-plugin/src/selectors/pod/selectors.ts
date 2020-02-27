import { get } from 'lodash';
import { getName, getNamespace, getOwnerReferences, getUID } from '@console/shared/src/selectors';
import { compareOwnerReference } from '@console/shared/src/utils/owner-references';
import { PodKind } from '@console/internal/module/k8s';
import { getLabelValue } from '../selectors';
import { VMKind, VMIKind } from '../../types';
import { getDataVolumeTemplates } from '../vm';
import {
  CDI_KUBEVIRT_IO,
  STORAGE_IMPORT_PVC_NAME,
  VIRT_LAUNCHER_POD_PREFIX,
} from '../../constants';
import { buildOwnerReferenceForModel } from '../../utils';
import { VirtualMachineInstanceModel } from '../../models';

export const getHostName = (pod: PodKind) =>
  get(pod, 'spec.hostname') as PodKind['spec']['hostname'];

export const getPodStatusPhase = (pod: PodKind) =>
  get(pod, 'status.phase') as PodKind['status']['phase'];
export const getPodStatusConditions = (pod: PodKind) =>
  get(pod, 'status.conditions', []) as PodKind['status']['conditions'];
export const getPodStatusConditionOfType = (pod: PodKind, type: string) =>
  getPodStatusConditions(pod).find((condition) => condition.type === type);

export const getPodFalseStatusConditions = (pod: PodKind) =>
  getPodStatusConditions(pod).filter((condition) => condition.status !== 'True');

export const getPodContainerStatuses = (pod: PodKind) =>
  get(pod, 'status.containerStatuses') as PodKind['status']['containerStatuses'];

export const findPodFalseStatusConditionMessage = (pod: PodKind) => {
  const notReadyConditions = getPodFalseStatusConditions(pod);
  if (notReadyConditions.length > 0) {
    return notReadyConditions[0].message || `Step: ${notReadyConditions[0].type}`;
  }
  return undefined;
};

export const isPodSchedulable = (pod: PodKind) => {
  const podScheduledCond = getPodStatusConditionOfType(pod, 'PodScheduled');
  return !(
    podScheduledCond &&
    podScheduledCond.status !== 'True' &&
    podScheduledCond.reason === 'Unschedulable'
  );
};

const isPodReady = (pod: PodKind): boolean =>
  pod?.status?.phase === 'Running' && pod?.status?.containerStatuses?.every((s) => s.ready);

export const findVMIPod = (
  vmi?: VMIKind,
  pods?: PodKind[],
  podNamePrefix = VIRT_LAUNCHER_POD_PREFIX,
) => {
  if (!pods || !vmi) {
    return null;
  }

  // the UID is not set as we mimic VMI here
  const vmOwnerReference = buildOwnerReferenceForModel(
    VirtualMachineInstanceModel,
    getName(vmi),
    getUID(vmi),
  );
  const prefix = `${podNamePrefix}${getName(vmi)}-`;
  const prefixedPods = pods.filter((p) => {
    const podOwnerReferences = getOwnerReferences(p);
    return (
      getNamespace(p) === getNamespace(vmi) &&
      getName(p).startsWith(prefix) &&
      podOwnerReferences &&
      podOwnerReferences.some((podOwnerReference) =>
        compareOwnerReference(podOwnerReference, vmOwnerReference),
      )
    );
  });

  // Return the newet most ready Pod created
  return prefixedPods
    .sort((a: PodKind, b: PodKind) =>
      a.metadata.creationTimestamp > b.metadata.creationTimestamp ? -1 : 1,
    )
    .sort((a: PodKind) =>
      isPodReady(a) ? -1 : 1,
    )[0];
};

export const getVMImporterPods = (
  vm: VMKind,
  pods?: PodKind[],
  pvcNameLabel = `${CDI_KUBEVIRT_IO}/${STORAGE_IMPORT_PVC_NAME}`,
) => {
  if (!pods) {
    return null;
  }

  const datavolumeNames = getDataVolumeTemplates(vm)
    .map((dataVolumeTemplate) => getName(dataVolumeTemplate))
    .filter((dataVolumeTemplate) => dataVolumeTemplate);

  return pods.filter(
    (p) =>
      getNamespace(p) === getNamespace(vm) &&
      getLabelValue(p, CDI_KUBEVIRT_IO) === 'importer' &&
      datavolumeNames.some((name) => getLabelValue(p, pvcNameLabel) === name),
  );
};
