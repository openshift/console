import type { ReactNode } from 'react';
import { forwardRef } from 'react';
import { css } from '@patternfly/react-styles';
import { Tr } from '@patternfly/react-table';
import * as _ from 'lodash';
import { getName } from '@console/shared/src/selectors/common';
import { getMachinePhase } from '@console/shared/src/selectors/machine';
import { getMachineSetInstanceType } from '@console/shared/src/selectors/machineSet';
import { pvcUsed } from '@console/shared/src/sorts/pvc';
import {
  snapshotContentSize,
  snapshotSize,
  snapshotSource,
  snapshotStatus,
} from '@console/shared/src/sorts/snapshot';
import * as UIActions from '../../actions/ui';
import { getClusterOperatorVersion, getJobTypeAndCompletions } from '../../module/k8s';
import { getClusterOperatorStatus } from '../../module/k8s/cluster-operator';
import { getLatestVersionForCRD } from '../../module/k8s/k8s';
import { podPhase, podReadiness, podRestarts } from '../../module/k8s/pods';
import { getTemplateInstanceStatus } from '../../module/k8s/template';
import type {
  ClusterOperator,
  CustomResourceDefinitionKind,
  K8sResourceKind,
  MachineKind,
  PodKind,
  VolumeSnapshotContentKind,
  VolumeSnapshotKind,
} from '../../module/k8s/types';
import { alertingRuleStateOrder, alertSeverityOrder } from '../monitoring/utils';
import { displayDurationInWords } from '../utils/build-utils';
import { convertToBaseValue } from '../utils/units';

export const sorts = {
  alertingRuleStateOrder,
  alertSeverityOrder,
  crdLatestVersion: (crd: CustomResourceDefinitionKind): string => getLatestVersionForCRD(crd),
  daemonsetNumScheduled: (daemonset) =>
    _.toInteger(_.get(daemonset, 'status.currentNumberScheduled')),
  dataSize: (resource) => _.size(_.get(resource, 'data')) + _.size(_.get(resource, 'binaryData')),
  instanceType: (obj): string => getMachineSetInstanceType(obj),
  jobCompletionsSucceeded: (job) => job?.status?.succeeded || 0,
  jobType: (job) => getJobTypeAndCompletions(job).type,
  numReplicas: (resource) => _.toInteger(_.get(resource, 'status.replicas')),
  namespaceCPU: (ns: K8sResourceKind): number => UIActions.getNamespaceMetric(ns, 'cpu'),
  namespaceMemory: (ns: K8sResourceKind): number => UIActions.getNamespaceMetric(ns, 'memory'),
  podCPU: (pod: PodKind): number => UIActions.getPodMetric(pod, 'cpu'),
  podMemory: (pod: PodKind): number => UIActions.getPodMetric(pod, 'memory'),
  podPhase,
  podReadiness: (pod: PodKind): number => podReadiness(pod).readyCount,
  podRestarts,
  pvStorage: (pv) => _.toInteger(convertToBaseValue(pv?.spec?.capacity?.storage)),
  pvcStorage: (pvc) => _.toInteger(convertToBaseValue(pvc?.status?.capacity?.storage)),
  string: (val) => JSON.stringify(val),
  number: (val) => _.toNumber(val),
  getClusterOperatorStatus: (operator: ClusterOperator) => getClusterOperatorStatus(operator),
  getClusterOperatorVersion: (operator: ClusterOperator) => getClusterOperatorVersion(operator),
  getTemplateInstanceStatus,
  machinePhase: (machine: MachineKind): string => getMachinePhase(machine),
  pvcUsed: (pvc: K8sResourceKind): number => pvcUsed(pvc),
  volumeSnapshotStatus: (snapshot: VolumeSnapshotKind | VolumeSnapshotContentKind): string =>
    snapshotStatus(snapshot),
  volumeSnapshotSize: (snapshot: VolumeSnapshotKind): number => snapshotSize(snapshot),
  volumeSnapshotContentSize: (snapshot: VolumeSnapshotContentKind): number =>
    snapshotContentSize(snapshot),
  volumeSnapshotSource: (snapshot: VolumeSnapshotKind): string => snapshotSource(snapshot),
  snapshotLastRestore: (snapshot: K8sResourceKind, { restores }) =>
    restores[getName(snapshot)]?.status?.restoreTime,
  buildDuration: (buildConfig) =>
    displayDurationInWords(
      buildConfig?.latestBuild?.status?.startTimestamp,
      buildConfig?.latestBuild?.status?.completionTimestamp,
    ),
};

// Common table row/columns helper SFCs for implementing accessible data grid
export const TableRow = forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ id, index, trKey, style, className, ...props }, ref) => (
    <Tr
      {...props}
      ref={ref}
      data-id={id}
      data-index={index}
      data-test="resource-row"
      data-test-rows="resource-row"
      data-key={trKey}
      style={style}
      className={css('pf-v6-c-table__tr', className)}
      role="row"
    />
  ),
);
TableRow.displayName = 'TableRow';

export type TableRowProps = {
  id: string | number;
  index: number;
  title?: string;
  trKey: string;
  style: object;
  className?: string;
  children?: ReactNode;
};
