import { get } from 'lodash';
import { getName, getNamespace } from '@console/shared/src/selectors';
import { PodKind } from '@console/internal/module/k8s';
import { getLabelValue } from '../selectors';
import { VMKind } from '../../types';
import { getDataVolumeTemplates } from '../vm';
import { CDI_KUBEVIRT_IO, STORAGE_IMPORT_PVC_NAME } from '../../constants';

export const getNodeName = (pod: PodKind) =>
  get(pod, 'spec.nodeName') as PodKind['spec']['nodeName'];
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

export const findPodWithOneOfStatuses = (pods: PodKind[], statuses: string[]) =>
  pods.find((p) => {
    const phase = getPodStatusPhase(p);
    return statuses.some((status) => status === phase);
  });

export const findVMPod = (pods: PodKind[], vm: VMKind, podNamePrefix: string) => {
  if (!pods) {
    return null;
  }
  const prefix = `${podNamePrefix}${getName(vm)}-`;
  const prefixedPods = pods.filter(
    (p) => getNamespace(p) === getNamespace(vm) && getName(p).startsWith(prefix),
  );

  return (
    findPodWithOneOfStatuses(prefixedPods, ['Running', 'Pending']) ||
    findPodWithOneOfStatuses(prefixedPods, ['Failed', 'Unknown']) // 2nd priority
  );
};

export const getVMImporterPods = (
  pods: PodKind[],
  vm: VMKind,
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
