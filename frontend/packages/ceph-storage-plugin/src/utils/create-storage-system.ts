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
import { ValidationType } from './common-ocs-install-el';
import { getZone, isFlexibleScaling, shouldDeployAsMinimal } from './install';
import { SUPPORTED_EXTERNAL_STORAGE } from '../components/create-storage-system/external-storage';
import { WizardNodeState, WizardState } from '../components/create-storage-system/reducer';
import { MINIMUM_NODES } from '../constants';

export const getStorageSystemKind = ({ kind, apiVersion, apiGroup }) =>
  `${kind.toLowerCase()}.${apiGroup}/${apiVersion}`;

export const createExternalSSName = (id: string = '') => id.toLowerCase().replace(/\s/g, '-');

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

export const createWizardNodeState = (nodes: NodeKind[]): WizardNodeState[] =>
  nodes.map((node) => {
    const name = getName(node);
    const hostName = getLabel(node, 'kubernetes.io/hostname', '');
    const cpu = getNodeCPUCapacity(node);
    const memory = getNodeAllocatableMemory(node);
    const zone = getZone(node);
    const uid = getUID(node);
    const roles = getNodeRoles(node).sort();
    const labels = node?.metadata?.labels;
    return {
      name,
      hostName,
      cpu,
      memory,
      zone,
      uid,
      roles,
      labels,
    };
  });

export const capacityAndNodesValidate = (
  nodes: WizardNodeState[],
  enableStretchCluster: boolean,
): ValidationType[] => {
  const validations = [];

  const totalCpu = getTotalCpu(nodes);
  const totalMemory = getTotalMemory(nodes);
  const zones = getAllZone(nodes);

  if (!enableStretchCluster && isFlexibleScaling(nodes.length, zones.size)) {
    validations.push(ValidationType.ATTACHED_DEVICES_FLEXIBLE_SCALING);
  }
  if (shouldDeployAsMinimal(totalCpu, totalMemory, nodes.length)) {
    validations.push(ValidationType.MINIMAL);
  }
  if (!enableStretchCluster && nodes.length < MINIMUM_NODES) {
    validations.push(ValidationType.MINIMUMNODES);
  }
  return validations;
};
