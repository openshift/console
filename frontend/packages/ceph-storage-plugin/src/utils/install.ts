import * as _ from 'lodash';
import * as fuzzy from 'fuzzysearch';
import { convertToBaseValue, humanizeBinaryBytes } from '@console/internal/components/utils';
import { NodeKind, Taint, k8sPatch } from '@console/internal/module/k8s';
import { NodeTableRow, FilterMode } from '../types';
import { OCS_TAINT, OCS_LABEL } from '../constants/ocs-install';
import { hasLabel } from '@console/shared';
import { NodeModel } from '@console/internal/models';

export const hasMinimumCPU = (node: NodeTableRow): boolean => {
  return convertToBaseValue(node.cpuCapacity) >= 16;
};

export const hasMinimumMemory = (node: NodeTableRow): boolean => {
  return convertToBaseValue(node.allocatableMemory) >= convertToBaseValue('64 Gi');
};

export const hasTaints = (node: NodeKind) => {
  return !_.isEmpty(node.spec.taints);
};

export const hasOCSTaint = (node: NodeKind) => {
  const taints: Taint[] = node.spec.taints || [];
  return taints.some((taint: Taint) => _.isEqual(taint, OCS_TAINT));
};

export const getConvertedUnits = (value: string) => {
  return humanizeBinaryBytes(convertToBaseValue(value)).string || '-';
};

export const hasOCSLabel = (node: NodeKind): boolean =>
  _.has(node, ['metadata', 'labels', OCS_LABEL]);

export const filterRows = (
  rows: NodeTableRow[],
  filterMode: FilterMode,
  filterValue: string,
): NodeTableRow[] => {
  if (filterValue === '') return rows;
  if (filterMode === FilterMode.NAME) return rows.filter((r) => fuzzy(filterValue, r.id));
  return rows.filter((r) => fuzzy(filterValue, JSON.stringify(r.metadata.labels)));
};

export const makeLabelNodesRequest = (selectedNodes: NodeTableRow[]): Promise<NodeKind>[] => {
  const patch = [
    {
      op: 'add',
      path: '/metadata/labels/cluster.ocs.openshift.io~1openshift-storage',
      value: '',
    },
  ];
  return _.reduce(
    selectedNodes,
    (accumulator, node) => {
      return hasLabel(node, OCS_LABEL)
        ? accumulator
        : [...accumulator, k8sPatch(NodeModel, node, patch)];
    },
    [],
  );
};
