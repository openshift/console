import * as _ from 'lodash';
import {
  NodeKind,
  Taint,
  StorageClassResourceKind,
  K8sResourceKind,
  MatchExpression,
} from '@console/internal/module/k8s';
import {
  humanizeBinaryBytes,
  convertToBaseValue,
  humanizeCpuCores,
} from '@console/internal/components/utils';
import {
  HOSTNAME_LABEL_KEY,
  LABEL_OPERATOR,
} from '@console/local-storage-operator-plugin/src/constants';
import { getNodeCPUCapacity, getNodeAllocatableMemory, getName } from '@console/shared';
import { ocsTaint, NO_PROVISIONER, AVAILABLE, MINIMUM_NODES, ZONE_LABELS } from '../constants';
import { Discoveries } from '../components/ocs-install/attached-devices/create-sc/state';
import { getSCAvailablePVs } from '../selectors';

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

export const getZone = (node: NodeKind) =>
  node.metadata.labels?.[ZONE_LABELS[0]] || node.metadata.labels?.[ZONE_LABELS[1]];

export const getTotalDeviceCapacity = (list: Discoveries[]): number =>
  list.reduce((res, device) => {
    if (device?.status?.state === AVAILABLE) {
      return res + device.size;
    }
    return res;
  }, 0);

export const getAssociatedNodes = (pvs: K8sResourceKind[]): string[] => {
  const nodes = pvs.reduce((res, pv) => {
    const matchExpressions: MatchExpression[] =
      pv?.spec?.nodeAffinity?.required?.nodeSelectorTerms?.[0]?.matchExpressions;
    matchExpressions.forEach(({ key, operator, values }) => {
      if (key === HOSTNAME_LABEL_KEY && operator === LABEL_OPERATOR) {
        values.forEach((value) => res.add(value));
      }
    });
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
      const zone = getZone(node);
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

export const isFlexibleScaling = (nodes, zones): boolean => !!(nodes >= MINIMUM_NODES && zones < 3);

export const countNodesPerZone = (nodes: NodeKind[]) =>
  nodes.reduce((acc, curr) => {
    const zone = getZone(curr);
    acc.hasOwnProperty(zone) ? (acc[zone] += 1) : (acc[zone] = 1);
    return acc;
  }, {});

export const nodesWithoutTaints = (nodes: NodeKind[]) =>
  nodes.filter((node: NodeKind) => hasOCSTaint(node) || hasNoTaints(node));

export const isArbiterSC = (
  sc: StorageClassResourceKind,
  pvData: K8sResourceKind[],
  nodesData: NodeKind[],
): boolean => {
  const pvs: K8sResourceKind[] = getSCAvailablePVs(pvData, getName(sc));
  const scNodeNames = getAssociatedNodes(pvs);
  const tableData: NodeKind[] = nodesData.filter(
    (node: NodeKind) =>
      scNodeNames.includes(getName(node)) ||
      scNodeNames.includes(node.metadata.labels?.['kubernetes.io/hostname']),
  );
  const uniqZones: Set<string> = new Set(nodesData.map(getZone));
  const uniqSelectedNodesZones: Set<string> = new Set(tableData.map(getZone));
  if (uniqZones.size < 3) return false;
  if (uniqSelectedNodesZones.size !== 2) return false;
  const zonePerNode = countNodesPerZone(tableData);
  return Object.keys(zonePerNode).every((zone) => zonePerNode[zone] >= 2);
};
