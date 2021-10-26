import { convertToBaseValue, humanizeCpuCores } from '@console/internal/components/utils';
import {
  getLabel,
  getName,
  getNodeAllocatableMemory,
  getNodeCPUCapacity,
  getNodeRoles,
  getUID,
} from '@console/shared/src';
import { NodeKind } from '@console/internal/module/k8s';
import { ClusterServiceVersionKind } from '@console/operator-lifecycle-manager/src';
import { ValidationType } from './common-ocs-install-el';
import { getZone, isFlexibleScaling, shouldDeployAsMinimal } from './install';
import { SUPPORTED_EXTERNAL_STORAGE } from '../components/create-storage-system/external-storage';
import { WizardNodeState, WizardState } from '../components/create-storage-system/reducer';
import { MINIMUM_NODES, ODF_OPERATOR, ODF_VENDOR_ANNOTATION } from '../constants';

export const getODFCsv = (csvList: ClusterServiceVersionKind[] = []) =>
  csvList.find((csv) => csv?.metadata.name?.substring(0, ODF_OPERATOR.length) === ODF_OPERATOR);

export const getSupportedVendors = (csv: ClusterServiceVersionKind): string[] => {
  const annotations = csv?.metadata?.annotations?.[ODF_VENDOR_ANNOTATION];
  return annotations ? JSON.parse(annotations) : [];
};

export const getStorageSystemKind = ({ kind, apiVersion, apiGroup }) =>
  `${kind.toLowerCase()}.${apiGroup}/${apiVersion}`;

export const getExternalSubSystemName = (name: string = '', storageClassName: string) =>
  `${name.toLowerCase().replace(/\s/g, '-')}-${storageClassName}`.substring(0, 230);

export const getExternalStorage = (id: WizardState['backingStorage']['externalStorage'] = '') =>
  SUPPORTED_EXTERNAL_STORAGE.find((p) => p.model.kind === id);

export const getTotalCpu = (nodes: WizardNodeState[]): number =>
  nodes.reduce((total: number, { cpu }) => total + humanizeCpuCores(Number(cpu)).value, 0);

export const getTotalMemory = (nodes: WizardNodeState[]): number =>
  nodes.reduce((total: number, { memory }) => total + convertToBaseValue(memory), 0);

export const getAllZone = (nodes: WizardNodeState[]): Set<string> =>
  nodes.reduce(
    (total: Set<string>, { zone }) => (zone ? total.add(zone) : total),
    new Set<string>(),
  );

export const createWizardNodeState = (nodes: NodeKind[] = []): WizardNodeState[] =>
  nodes.map((node) => {
    const name = getName(node);
    const hostName = getLabel(node, 'kubernetes.io/hostname', '');
    const cpu = getNodeCPUCapacity(node);
    const memory = getNodeAllocatableMemory(node);
    const zone = getZone(node);
    const uid = getUID(node);
    const roles = getNodeRoles(node).sort();
    const labels = node?.metadata?.labels;
    const taints = node?.spec?.taints;
    return {
      name,
      hostName,
      cpu,
      memory,
      zone,
      uid,
      roles,
      labels,
      taints,
    };
  });

export const capacityAndNodesValidate = (
  nodes: WizardNodeState[],
  enableStretchCluster: boolean,
  isNoProvSC: boolean,
): ValidationType[] => {
  const validations = [];

  const totalCpu = getTotalCpu(nodes);
  const totalMemory = getTotalMemory(nodes);
  const zones = getAllZone(nodes);

  if (!enableStretchCluster && isNoProvSC && isFlexibleScaling(nodes.length, zones.size)) {
    validations.push(ValidationType.ATTACHED_DEVICES_FLEXIBLE_SCALING);
  }
  if (shouldDeployAsMinimal(totalCpu, totalMemory, nodes.length)) {
    validations.push(ValidationType.MINIMAL);
  }
  if (!enableStretchCluster && nodes.length && nodes.length < MINIMUM_NODES) {
    validations.push(ValidationType.MINIMUMNODES);
  }
  return validations;
};

export const getPVAssociatedNodesPerZone = (nodes: WizardNodeState[]): NodesPerZoneMap =>
  nodes.reduce((data, { zone }) => {
    if (data[zone]) data[zone] += 1;
    else if (zone) data[zone] = 1;
    return data;
  }, {});

export type NodesPerZoneMap = {
  [zones: string]: number;
};

export const isValidStretchClusterTopology = (
  nodesPerZoneMap: NodesPerZoneMap,
  allZones: string[],
): boolean => {
  if (allZones.length >= 3) {
    const validNodesWithPVPerZone = allZones.filter((zone) => nodesPerZoneMap[zone] >= 2);
    return validNodesWithPVPerZone.length >= 2;
  }
  return false;
};

export const getZonesFromNodesKind = (nodes: NodeKind[]) =>
  nodes.reduce((data, node) => {
    const zone = getZone(node);
    if (!data.includes(zone)) data.push(zone);
    return data;
  }, []);
