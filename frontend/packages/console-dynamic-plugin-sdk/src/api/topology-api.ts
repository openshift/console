/* eslint-disable */
import {
  CpuCellComponentProps,
  CreateConnectorProps,
  MemoryCellComponentProps,
} from '../extensions/topology-types';

// export const BaseNode: React.FC<BaseNodeProps> = require('@console/topology/src/components/graph-view/components/nodes/BaseNode')
//   .BaseNode;

export const getModifyApplicationAction = require('@console/topology/src/actions/modify-application')
  .getModifyApplicationAction;

export const baseDataModelGetter = require('@console/topology/src/data-transforms/data-transformer')
  .baseDataModelGetter;

export const getWorkloadResources = require('@console/topology/src/data-transforms/transform-utils')
  .getWorkloadResources;

export const contextMenuActions = require('@console/topology/src/actions/contextMenuActions')
  .contextMenuActions;

export const withCreateConnector = require('@console/topology/src/behavior/withCreateConnector')
  .withCreateConnector;

export const CreateConnector: React.FC<CreateConnectorProps> = require('@console/topology/src/components/graph-view/components/edges/CreateConnector')
  .default;

export const createConnectorCallback = require('@console/topology/src/components/graph-view/components/componentUtils')
  .createConnectorCallback;

export const nodeDragSourceSpec = require('@console/topology/src/components/graph-view/components/componentUtils')
  .nodeDragSourceSpec;

export const nodeDropTargetSpec = require('@console/topology/src/components/graph-view/components/componentUtils')
  .nodeDropTargetSpec;

export const withContextMenu = require('@console/topology/src/components/graph-view/components/componentUtils')
  .withContextMenu;

export const getTopologyEdgeItems = require('@console/topology/src/data-transforms/transform-utils')
  .getTopologyEdgeItems;

export const getTopologyGroupItems = require('@console/topology/src/data-transforms/transform-utils')
  .getTopologyGroupItems;

export const getTopologyNodeItem = require('@console/topology/src/data-transforms/transform-utils')
  .getTopologyNodeItem;

export const mergeGroup = require('@console/topology/src/data-transforms/transform-utils')
  .mergeGroup;

export const WorkloadModelProps = require('@console/topology/src/data-transforms/transform-utils')
  .WorkloadModelProps;

export const CpuCellComponent: React.FC<CpuCellComponentProps> = require('@console/topology/src/components/list-view/cells/CpuCell')
  .CpuCellComponent;

export const MemoryCellComponent: React.FC<MemoryCellComponentProps> = require('@console/topology/src/components/list-view/cells/MemoryCell')
  .MemoryCellComponent;

export const getPodMetricStats = require('@console/topology/src/utils/metricStats')
  .getPodMetricStats;
