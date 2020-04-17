import * as _ from 'lodash';
import { getName, getNamespace, getOwnerReferences } from '@console/shared/src/selectors';
import { compareOwnerReference } from '@console/shared/src/utils/owner-references';
import { PodKind } from '@console/internal/module/k8s';
import { buildOwnerReference } from '../../utils';
import { VMIKind, VMKind } from '../../types/vm';
import { OS_WINDOWS_PREFIX } from '../../constants';
import { isVMRunning, getOperatingSystem } from './selectors';
import { VMILikeEntityKind } from '../../types/vmLike';

export const isVMRunningWithVMI = ({ vm, vmi }: { vm: VMKind; vmi: VMIKind }): boolean =>
  isVMRunning(vm) && !_.isEmpty(vmi);

export const isWindows = (vm: VMKind): boolean =>
  (getOperatingSystem(vm) || '').startsWith(OS_WINDOWS_PREFIX);

export const findConversionPod = (vm: VMILikeEntityKind, pods: PodKind[]) => {
  if (!pods) {
    return null;
  }

  const vmOwnerReference = buildOwnerReference(vm);

  return pods.find((pod) => {
    const podOwnerReferences = getOwnerReferences(pod);
    return (
      getNamespace(pod) === getNamespace(vm) &&
      getName(pod).startsWith('kubevirt-v2v-conversion') &&
      podOwnerReferences &&
      podOwnerReferences.some((podOwnerReference) =>
        compareOwnerReference(podOwnerReference, vmOwnerReference),
      )
    );
  });
};
