import * as _ from 'lodash';
import {
  NodeKind,
  Taint,
  StorageClassResourceKind,
  K8sResourceKind,
  MatchExpression,
  k8sPatch,
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
import { NodeModel } from '@console/internal/models';
import {
  ocsTaint,
  OCS_PROVISIONERS,
  NO_PROVISIONER,
  MINIMUM_NODES,
  ZONE_LABELS,
  RACK_LABEL,
} from '../constants';
import { getSCAvailablePVs } from '../selectors';

export const hasNoTaints = (node: NodeKind) => {
  return _.isEmpty(node.spec?.taints);
};

export const hasOCSTaint = (node: NodeKind) => {
  const taints: Taint[] = node.spec?.taints || [];
  return taints.some((taint: Taint) => _.isEqual(taint, ocsTaint));
};

export const taintNodes = (selectedNodes: NodeKind[]): Promise<NodeKind>[] => {
  const taintNodesRequest = selectedNodes.map((node) => {
    const taints = node?.spec?.taints ? [...node.spec.taints, ocsTaint] : [ocsTaint];
    const patch = [
      {
        value: taints,
        path: '/spec/taints',
        op: node.spec.taints ? 'replace' : 'add',
      },
    ];
    return k8sPatch(NodeModel, node, patch);
  });
  return taintNodesRequest;
};

export const getConvertedUnits = (value: string) => {
  return humanizeBinaryBytes(convertToBaseValue(value)).string ?? '-';
};

export const filterSC = (sc: StorageClassResourceKind) =>
  !OCS_PROVISIONERS.some((ocsProvisioner: string) => sc?.provisioner?.includes(ocsProvisioner));

export const filterSCWithNoProv = (sc: StorageClassResourceKind) =>
  sc?.provisioner === NO_PROVISIONER;

export const filterSCWithoutNoProv = (sc: StorageClassResourceKind) =>
  sc?.provisioner !== NO_PROVISIONER;

export const getZone = (node: NodeKind) =>
  node.metadata.labels?.[ZONE_LABELS[0]] || node.metadata.labels?.[ZONE_LABELS[1]];

export const getRack = (node: NodeKind) => node.metadata.labels?.[RACK_LABEL];

export const getAssociatedNodes = (pvs: K8sResourceKind[]): string[] => {
  const nodes = pvs.reduce((res, pv) => {
    const matchExpressions: MatchExpression[] =
      pv?.spec?.nodeAffinity?.required?.nodeSelectorTerms?.[0]?.matchExpressions || [];
    matchExpressions.forEach(({ key, operator, values }) => {
      if (key === HOSTNAME_LABEL_KEY && operator === LABEL_OPERATOR) {
        values.forEach((value) => res.add(value));
      }
    });
    return res;
  }, new Set<string>());

  return Array.from(nodes);
};

export const getTopologyInfo = (nodes: NodeKind[]) =>
  nodes.reduce(
    (data, node) => {
      const zone = getZone(node);
      const rack = getRack(node);
      if (zone && (hasOCSTaint(node) || hasNoTaints(node))) data.zones.add(zone);
      if (rack && (hasOCSTaint(node) || hasNoTaints(node))) data.racks.add(rack);
      return data;
    },
    {
      zones: new Set<string>(),
      racks: new Set<string>(),
    },
  );

export const getNodeInfo = (nodes: NodeKind[]) =>
  nodes.reduce(
    (data, node) => {
      const cpus = humanizeCpuCores(Number(getNodeCPUCapacity(node))).value;
      const memoryRaw = getNodeAllocatableMemory(node);
      const memory = convertToBaseValue(memoryRaw);
      const zone = getZone(node);
      data.cpu += cpus;
      data.memory += memory;
      if (zone && (hasOCSTaint(node) || hasNoTaints(node))) data.zones.add(zone);
      return data;
    },
    {
      cpu: 0,
      memory: 0,
      zones: new Set<string>(),
    },
  );

export const shouldDeployAsMinimal = (cpu: number, memory: number, nodesCount: number): boolean => {
  if (nodesCount >= MINIMUM_NODES) {
    const humanizedMem = humanizeBinaryBytes(memory, null, 'GiB').value;
    return cpu < 30 || humanizedMem < 72;
  }
  return false;
};

export const isFlexibleScaling = (nodes: number, zones: number): boolean =>
  !!(nodes >= MINIMUM_NODES && zones < 3);

export const countNodesPerZone = (nodes: NodeKind[]) =>
  nodes.reduce((acc, curr) => {
    const zone = getZone(curr);
    acc.hasOwnProperty(zone) ? (acc[zone] += 1) : (acc[zone] = 1);
    return acc;
  }, {});

export const nodesWithoutTaints = (nodes: NodeKind[]) =>
  nodes.filter((node: NodeKind) => hasOCSTaint(node) || hasNoTaints(node));

const getSelectedNodes = (
  scName: string,
  pvData: K8sResourceKind[],
  nodesData: NodeKind[],
): NodeKind[] => {
  const pvs: K8sResourceKind[] = getSCAvailablePVs(pvData, scName);
  const scNodeNames = getAssociatedNodes(pvs);
  const tableData: NodeKind[] = nodesData.filter(
    (node: NodeKind) =>
      scNodeNames.includes(getName(node)) ||
      scNodeNames.includes(node.metadata.labels?.['kubernetes.io/hostname']),
  );
  return tableData;
};

export const isValidTopology = (
  scName: string,
  pvData: K8sResourceKind[],
  nodesData: NodeKind[],
): boolean => {
  const tableData: NodeKind[] = getSelectedNodes(scName, pvData, nodesData);

  /** For AWS scenario, checking if PVs are in 3 different zones or not
   *  For Baremetal/Vsphere scenario, checking if PVs are in 3 different racks or not
   */
  const { zones, racks } = getTopologyInfo(tableData);
  return zones.size >= MINIMUM_NODES || racks.size >= MINIMUM_NODES;
};

export const isArbiterSC = (
  scName: string,
  pvData: K8sResourceKind[],
  nodesData: NodeKind[],
): boolean => {
  const tableData: NodeKind[] = getSelectedNodes(scName, pvData, nodesData);
  const uniqZones: Set<string> = new Set(nodesData.map(getZone));
  const uniqSelectedNodesZones: Set<string> = getNodeInfo(tableData).zones;
  if (_.compact([...uniqZones]).length < 3) return false;
  if (uniqSelectedNodesZones.size !== 2) return false;
  const zonePerNode = countNodesPerZone(tableData);
  return Object.keys(zonePerNode).every((zone) => zonePerNode[zone] >= 2);
};
