import * as _ from 'lodash';
import {
  NodeKind,
  Taint,
  StorageClassResourceKind,
  K8sResourceKind,
} from '@console/internal/module/k8s';
import {
  humanizeBinaryBytes,
  convertToBaseValue,
  humanizeCpuCores,
} from '@console/internal/components/utils';
import { HOSTNAME_LABEL_KEY } from '@console/local-storage-operator-plugin/src/constants';
import { getNodeCPUCapacity, getNodeAllocatableMemory } from '@console/shared';
import { ocsTaint, NO_PROVISIONER, AVAILABLE, MINIMUM_NODES, ZONE_LABELS } from '../constants';
import { Discoveries } from '../components/ocs-install/attached-devices/create-sc/state';

export const hasNoTaints = (node: NodeKind) => {
  return _.isEmpty(node.spec?.taints);
};

export const hasOCSTaint = (node: NodeKind) => {
  const taints: Taint[] = node.spec?.taints || [];
  return taints.some((taint: Taint) => _.isEqual(taint, ocsTaint));
};

export const getConvertedUnits = (value: string) => {
  return humanizeBinaryBytes(convertToBaseValue(value)).string ?? '-';
};

export const filterSCWithNoProv = (sc: StorageClassResourceKind) =>
  sc?.provisioner === NO_PROVISIONER;

export const filterSCWithoutNoProv = (sc: StorageClassResourceKind) =>
  sc?.provisioner !== NO_PROVISIONER;

export const getTotalDeviceCapacity = (list: Discoveries[]) => {
  const totalCapacity = list.reduce((res, device) => {
    if (device?.status?.state === AVAILABLE) {
      return res + device.size;
    }
    return res;
  }, 0);

  return humanizeBinaryBytes(totalCapacity);
};

export const getAssociatedNodes = (pvs: K8sResourceKind[]): string[] => {
  const nodes = pvs.reduce((res, pv) => {
    const nodeName = pv?.metadata?.labels?.[HOSTNAME_LABEL_KEY];
    if (nodeName) {
      res.add(nodeName);
    }
    return res;
  }, new Set<string>());

  return Array.from(nodes);
};

export const getNodeInfo = (nodes: NodeKind[]) =>
  nodes.reduce(
    (data, node) => {
      const cpus = humanizeCpuCores(Number(getNodeCPUCapacity(node))).value;
      const memoryRaw = getNodeAllocatableMemory(node);
      const memory = convertToBaseValue(memoryRaw);
      const zone = node.metadata.labels?.[ZONE_LABELS[0]] || node.metadata.labels?.[ZONE_LABELS[1]];
      data.cpu += cpus;
      data.memory += memory;
      if (zone && hasNoTaints(node)) data.zones.add(zone);
      return data;
    },
    {
      cpu: 0,
      memory: 0,
      zones: new Set(),
    },
  );

export const shouldDeployAsMinimal = (cpu: number, memory: number, nodesCount: number): boolean => {
  if (nodesCount >= MINIMUM_NODES) {
    const humanizedMem = humanizeBinaryBytes(memory, null, 'GiB').value;
    return cpu < 30 || humanizedMem < 72;
  }
  return false;
};
