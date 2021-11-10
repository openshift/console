import * as _ from 'lodash';
import { Base64 } from 'js-base64';
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
  IP_FAMILY,
} from '../constants';
import { getSCAvailablePVs } from '../selectors';

const pluralize = (count: number, singular: string, plural: string = `${singular}s`): string =>
  count > 1 ? plural : singular;

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

export const nodesWithoutTaints = (nodes: NodeKind[] = []) =>
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

export const getIPFamily = (addr: string): IP_FAMILY => {
  const ipPattern = /^[0-9]*\.[0-9]*\.[0-9]*\.[0-9]*$/;
  return ipPattern.test(addr) ? IP_FAMILY.IPV4 : IP_FAMILY.IPV6;
};

export const isValidJSON = (fData: string): boolean => {
  try {
    JSON.parse(fData);
    return true;
  } catch (e) {
    return false;
  }
};

export const createDownloadFile = (data: string = ''): string =>
  `data:application/octet-stream;charset=utf-8,${encodeURIComponent(Base64.decode(data))}`;

export const checkError = (
  data: string = '{}',
  requiredKeys = [],
  requiresEncodingKeys = [],
  ipFamily = IP_FAMILY.IPV4,
): string => {
  const parsedData = JSON.parse(data);
  const providedKeys = _.map(parsedData, (item) => item.name);
  const emptyKeys = [];
  const base64ErrorKeys = [];
  _.map(parsedData, (item) => {
    if (_.isEmpty(item.data)) emptyKeys.push(item.name ?? 'Unrecongnized key');
    if (requiresEncodingKeys.includes(item.name)) {
      _.isEmpty(item.data?.userKey) &&
        _.isEmpty(item.data?.adminKey) &&
        base64ErrorKeys.push(item.name ?? 'Unrecognized key');
      try {
        atob(item.data?.userKey ?? item.data?.adminKey);
      } catch (e) {
        base64ErrorKeys.push(item.name ?? 'Unrecognized key');
      }
    }
  });

  // Check for missing keys
  const missingKeys = _.difference(_.concat(requiredKeys, requiresEncodingKeys), providedKeys);
  if (missingKeys.length > 0 && providedKeys.length > 0) {
    return `${_.uniq(missingKeys).join(', ')} ${pluralize(
      _.uniq(missingKeys).length,
      'is',
      'are',
    )} missing.`;
  }

  if (emptyKeys.length > 0) {
    return `${_.uniq(emptyKeys).join(', ')} ${pluralize(
      emptyKeys.length,
      'has',
      'have',
    )} empty ${pluralize(emptyKeys.length, 'value')}.`;
  }

  if (base64ErrorKeys.length > 0) {
    return `${_.uniq(base64ErrorKeys).join(', ')} ${pluralize(
      base64ErrorKeys.length,
      'key',
    )} ${pluralize(base64ErrorKeys.length, 'has', 'have')} malformed Base64 encoding ${pluralize(
      base64ErrorKeys.length,
      'value',
    )}.`;
  }

  // Check IP Compatibility
  const endpoints = _.find(parsedData, { name: 'rook-ceph-mon-endpoints' });
  const ipAddr = (endpoints as any).data?.data?.split('=')?.[1]?.split(':')?.[0];

  if (ipFamily !== getIPFamily(ipAddr)) {
    return 'The IP Family of the two clusters do not match.';
  }

  return '';
};

export const prettifyJSON = (data: string) =>
  _.isEmpty(data)
    ? ''
    : (() => {
        const jsonData = JSON.parse(data);
        let container = ``;
        _.map(
          jsonData,
          (item) =>
            (container += `${_.upperCase(item.name ?? 'Unrecognized key')} = ${
              item.data ? JSON.stringify(item.data) : 'Unrecognized value'
            }\n`),
        );
        return container;
      })();

export const getDeviceSetCount = (pvCount: number, replica: number): number =>
  Math.floor(pvCount / replica) || 1;
