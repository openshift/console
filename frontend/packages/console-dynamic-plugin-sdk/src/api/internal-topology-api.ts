/* eslint-disable */
import * as React from 'react';
import {
  CpuCellComponentProps,
  MemoryCellComponentProps,
  TopologyListViewNodeProps,
  UseOverviewMetrics,
  WithEditReviewAccess,
  GetPodMetricStats,
  GetTopologyResourceObject,
  GetResource,
  GetTopologyEdgeItems,
  GetTopologyGroupItems,
  GetTopologyNodeItem,
  MergeGroup,
  GetModifyApplicationAction,
  BaseDataModelGetter,
  GetWorkloadResources,
  ContextMenuActions,
  CreateConnectorProps,
  OdcBaseNodeConstructor,
  WorkloadNodeProps,
  PodSetProps,
  BaseNodeProps,
  WithContextMenu,
  WithCreateConnector,
} from '../extensions/topology-types';

export const CpuCellComponent: React.FC<CpuCellComponentProps> = require('@console/topology/src/components/list-view/cells/CpuCell')
  .CpuCellComponent;

export const MemoryCellComponent: React.FC<MemoryCellComponentProps> = require('@console/topology/src/components/list-view/cells/MemoryCell')
  .MemoryCellComponent;

export const TopologyListViewNode: React.FC<TopologyListViewNodeProps> = require('@console/topology/src/components/list-view/TopologyListViewNode')
  .default;

export const useOverviewMetrics: UseOverviewMetrics = require('@console/topology/src/utils/useOverviewMetrics')
  .useOverviewMetrics;

export const withEditReviewAccess: WithEditReviewAccess = require('@console/topology/src/utils/withEditReviewAccess')
  .withEditReviewAccess;

export const getPodMetricStats: GetPodMetricStats = require('@console/topology/src/utils/metricStats')
  .getPodMetricStats;

export const getTopologyResourceObject: GetTopologyResourceObject = require('@console/topology/src/utils/topology-utils')
  .getTopologyResourceObject;

export const getResource: GetResource = require('@console/topology/src/utils/topology-utils')
  .getResource;

export const getTopologyEdgeItems: GetTopologyEdgeItems = require('@console/topology/src/data-transforms/transform-utils')
  .getTopologyEdgeItems;

export const getTopologyGroupItems: GetTopologyGroupItems = require('@console/topology/src/data-transforms/transform-utils')
  .getTopologyGroupItems;

export const getTopologyNodeItem: GetTopologyNodeItem = require('@console/topology/src/data-transforms/transform-utils')
  .getTopologyNodeItem;

export const mergeGroup: MergeGroup = require('@console/topology/src/data-transforms/transform-utils')
  .mergeGroup;

export const getModifyApplicationAction: GetModifyApplicationAction = require('@console/topology/src/actions/modify-application')
  .getModifyApplicationAction;

export const baseDataModelGetter: BaseDataModelGetter = require('@console/topology/src/data-transforms/data-transformer')
  .baseDataModelGetter;

export const getWorkloadResources: GetWorkloadResources = require('@console/topology/src/data-transforms/transform-utils')
  .getWorkloadResources;

export const contextMenuActions: ContextMenuActions = require('@console/topology/src/actions/contextMenuActions')
  .contextMenuActions;

export const CreateConnector: CreateConnectorProps = require('@console/topology/src/components/graph-view')
  .CreateConnector;

export const createConnectorCallback = require('@console/topology/src/components/graph-view')
  .createConnectorCallback;

export const OdcBaseNode: OdcBaseNodeConstructor = require('@console/topology/src/elements')
  .OdcBaseNode;

export const WorkloadNode: React.FC<WorkloadNodeProps> = require('@console/topology/src/components/graph-view')
  .WorkloadNode;

export const PodSet: React.FC<PodSetProps> = require('@console/topology/src/components/graph-view')
  .PodSet;

export const BaseNode: React.FC<BaseNodeProps> = require('@console/topology/src/components/graph-view')
  .BaseNode;

export const withContextMenu: WithContextMenu = require('@console/topology/src/components/graph-view')
  .withContextMenu;

export const withCreateConnector: WithCreateConnector = require('@console/topology/src/behavior')
  .withCreateConnector;
