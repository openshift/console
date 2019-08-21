import * as _ from 'lodash';
import { getName, getNamespace, getOwnerReferences } from '@console/shared/src/selectors';
import { createBasicLookup } from '@console/shared/src/utils/utils';
import { K8sResourceKind, PodKind } from '@console/internal/module/k8s';
import { buildOwnerReference, compareOwnerReference } from '../../utils';
import { VMIKind, VMKind } from '../../types/vm';
import { VMMultiStatus } from '../../types';
import {
  VM_STATUS_IMPORTING,
  VM_STATUS_V2V_CONVERSION_IN_PROGRESS,
} from '../../statuses/vm/constants';
import { NetworkType, POD_NETWORK } from '../../constants/vm';
import { getUsedNetworks, isVMRunning } from './selectors';
import { Network } from './types';

const IMPORTING_STATUSES = new Set([VM_STATUS_IMPORTING, VM_STATUS_V2V_CONVERSION_IN_PROGRESS]);

export const isVMImporting = (status: VMMultiStatus): boolean =>
  status && IMPORTING_STATUSES.has(status.status);

export const isVMRunningWithVMI = ({ vm, vmi }: { vm: VMKind; vmi: VMIKind }): boolean =>
  isVMRunning(vm) && !_.isEmpty(vmi);

export const getNetworkChoices = (vm: VMKind, nads: K8sResourceKind[]): Network[] => {
  const usedNetworks = getUsedNetworks(vm);
  const usedMultuses = usedNetworks.filter(
    (usedNetwork) => usedNetwork.networkType === NetworkType.MULTUS,
  );
  const usedMultusesLookup = createBasicLookup(usedMultuses, (multus) => _.get(multus, 'name'));

  const networkChoices = nads
    .map((nad) => getName(nad))
    .filter((nadName) => !usedMultusesLookup[nadName])
    .map((name) => ({
      name,
      networkType: NetworkType.MULTUS,
    }));

  if (!usedNetworks.find((usedNetwork) => usedNetwork.networkType === NetworkType.POD)) {
    networkChoices.push({
      name: POD_NETWORK,
      networkType: NetworkType.POD,
    });
  }
  return networkChoices;
};

export const findConversionPod = (vm: VMKind, pods: PodKind[]) => {
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
