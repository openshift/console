import type { ComponentType, FC, ReactNode } from 'react';
import { forwardRef } from 'react';
import { css } from '@patternfly/react-styles';
import type { IRow, OnSelect, SortByDirection, TableGridBreakpoint } from '@patternfly/react-table';
import { Tr } from '@patternfly/react-table';
import type { Scroll } from '@patternfly/react-virtualized-extension/dist/esm/components/Virtualized/types';
import * as _ from 'lodash';
import type { K8sResourceKindReference } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
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
import type { RowFilter } from '../filter-toolbar';
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
  id: number | string;
  index: number;
  title?: string;
  trKey: string;
  style: object;
  className?: string;
  children?: ReactNode;
};

type VirtualBodyProps = {
  customData?: any;
  Row: FC<RowFunctionArgs>;
  height: number;
  isScrolling: boolean;
  onChildScroll: (params: Scroll) => void;
  data: any[];
  columns: any[];
  scrollTop: number;
  width: number;
  expand: boolean;
  getRowProps?: (obj: any) => Partial<Pick<TableRowProps, 'id' | 'className' | 'title'>>;
  onRowsRendered?: (params: {
    overscanStartIndex: number;
    overscanStopIndex: number;
    startIndex: number;
    stopIndex: number;
  }) => void;
};

type HeaderFunc = (componentProps: ComponentProps) => TableColumn[];

export type Filter = { key: string; value: string };

type RowsArgs = {
  componentProps: ComponentProps;
  selectedResourcesForKind: string[];
  customData: any;
};

export type TableColumn = {
  title: string;
  id?: string;
  additional?: boolean;
  sortFunc?: string;
  sortField?: string;
  props?: any;
};

type RowFunctionArgs<T = any, C = any> = {
  obj: T;
  columns: any[];
  customData?: C;
};

export type TableProps = Partial<ComponentProps> & {
  customData?: any;
  customSorts?: { [key: string]: (obj: any) => number | string };
  defaultSortFunc?: string;
  defaultSortField?: string;
  defaultSortOrder?: SortByDirection;
  showNamespaceOverride?: boolean;
  Header: HeaderFunc;
  loadError?: string | Object;
  Row?: FC<RowFunctionArgs>;
  Rows?: (args: RowsArgs) => IRow[];
  'aria-label': string;
  onSelect?: OnSelect;
  virtualize?: boolean;
  NoDataEmptyMsg?: ComponentType<{}>;
  EmptyMsg?: ComponentType<{}>;
  loaded?: boolean;
  reduxID?: string;
  reduxIDs?: string[];
  rowFilters?: RowFilter[];
  label?: string;
  columnManagementID?: string;
  isPinned?: (val: any) => boolean;
  staticFilters?: Filter[];
  filters?: Filter[];
  activeColumns?: Set<string>;
  gridBreakPoint?: TableGridBreakpoint;
  selectedResourcesForKind?: string[];
  mock?: boolean;
  expand?: boolean;
  scrollElement?: HTMLElement | (() => HTMLElement);
  getRowProps?: VirtualBodyProps['getRowProps'];
  onRowsRendered?: VirtualBodyProps['onRowsRendered'];
  'data-test'?: string;
};

type ComponentProps = {
  data: any[];
  filters: Filter[];
  selected: boolean;
  kindObj: K8sResourceKindReference;
};
