import { get } from 'lodash';
import { PersistentVolumeClaimKind, PodKind } from '@console/internal/module/k8s';
import { VMIKind, VMKind } from '../../types';
import { createBasicLookup } from '../../utils';
import { getPvcImportPodName, getPvcUploadPodName } from '../pvc/selectors';
import { getName, getNamespace, getOwnerReferences, getUID } from '../selectors';
import { getDataVolumeTemplates } from '../vm';

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

export const findVMIPod = (vmi?: VMIKind, pods?: PodKind[]) => {
  if (!pods || !vmi) {
    return null;
  }

  const vmUID = getUID(vmi);
  const prefixedPods = pods.filter((p) => {
    const podOwnerReferences = getOwnerReferences(p);
    return (
      getNamespace(p) === getNamespace(vmi) &&
      podOwnerReferences &&
      podOwnerReferences.some((podOwnerReference) => podOwnerReference.uid === vmUID)
    );
  });

  // Return the newest, most ready Pod created
  return prefixedPods
    .sort((a: PodKind, b: PodKind) =>
      a.metadata.creationTimestamp > b.metadata.creationTimestamp ? -1 : 1,
    )
    .sort((a: PodKind) => (isPodReady(a) ? -1 : 1))[0];
};

export const getPVCNametoImporterPodsMapForVM = (
  vm: VMKind,
  pods?: PodKind[],
  pvcs?: PersistentVolumeClaimKind[],
) => {
  if (!pods) {
    return null;
  }

  const dataVolumeNames = getDataVolumeTemplates(vm).reduce((dataVolumeNameAcc, dvTemplate) => {
    const dataVolumeName = getName(dvTemplate);
    if (dataVolumeName) {
      dataVolumeNameAcc.add(dataVolumeName);
    }
    return dataVolumeNameAcc;
  }, new Set()) as Set<string>;

  const vmPVCs = pvcs?.filter((pvc) => dataVolumeNames?.has(getName(pvc)));

  const podLookup = createBasicLookup(pods, getName);

  return (vmPVCs || []).reduce((podsMap, pvc) => {
    const pod = podLookup[getPvcImportPodName(pvc) || getPvcUploadPodName(pvc)];
    if (pod) {
      podsMap[getName(pvc)] = pod;
    }
    return podsMap;
  }, {});
};
