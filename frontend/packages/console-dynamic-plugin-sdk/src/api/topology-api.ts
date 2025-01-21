/* eslint-disable */
import * as React from 'react';
import {
  CpuCellComponentProps,
  MemoryCellComponentProps,
  TopologyListViewNodeProps,
  GetTopologyEdgeItems,
  GetTopologyGroupItems,
  GetTopologyNodeItem,
  MergeGroup,
} from '../extensions/topology-types';

export type {
  CpuCellComponentProps,
  MemoryCellComponentProps,
  TopologyListViewNodeProps,
  GetTopologyEdgeItems,
  GetTopologyGroupItems,
  GetTopologyNodeItem,
  MergeGroup,
} from '../extensions/topology-types';

/**
 * A component that renders CPU core information within a tooltip.
 *
 * @component
 * @param {MetricsTooltipProps['byPod']} cpuByPod - Array of CPU usage per Pod.
 * @param {number} totalCores - Total number of CPU cores used.
 *
 * @example
 * ```tsx
 * <CpuCellComponent
 *   cpuByPod={[
 *     { name: 'Pod1', value: 2, formattedValue: '2 cores' },
 *     { name: 'Pod2', value: 6, formattedValue: '6 cores' },
 *   ]}
 *   totalCores={8}
 * />
 * ```
 */
export const CpuCellComponent: React.FC<CpuCellComponentProps> = require('@console/topology/src/components/list-view/cells/CpuCell')
  .CpuCellComponent;

/**
 * A component that renders memory usage information within a tooltip.
 *
 * @component
 * @param {MetricsTooltipProps['byPod']} memoryByPod - Array of memory usage per Pod.
 * @param {number} totalBytes - Total memory usage in bytes.
 *
 * @example
 * ```tsx
 * <MemoryCellComponent
 *   memoryByPod={[
 *     { name: 'Pod1', value: 4194304, formattedValue: '4 MiB' },
 *     { name: 'Pod2', value: 4194304, formattedValue: '4 MiB' },
 *   ]}
 *   totalBytes={8388608} // Represents 8 MiB
 * />
 * ```
 */
export const MemoryCellComponent: React.FC<MemoryCellComponentProps> = require('@console/topology/src/components/list-view/cells/MemoryCell')
  .MemoryCellComponent;

/**
 * A component that renders a row in the topology list view, with support for various cell types
 * like memory, CPU, alerts, and status. It supports expandable groups and selection functionalities.
 *
 * **Note**: When using this component, it is required to wrap the `TopologyListViewNode` inside a
 * `<DataList>` component (from PatternFly), like this:
 *
 * ```tsx
 * <DataList aria-label="Topology List View">
 *   <TopologyListViewNode ... />
 * </DataList>
 * ```
 *
 * @param {Node} item - The topology node item to render.
 * @param {string[]} selectedIds - Array of selected node IDs.
 * @param {(ids: string[]) => void} onSelect - Callback for handling node selection.
 * @param {React.ReactNode} [badgeCell] - Custom content for the badge cell.
 * @param {React.ReactNode} [labelCell] - Custom content for the label cell.
 * @param {React.ReactNode} [alertsCell] - Custom content for the alerts cell.
 * @param {React.ReactNode} [memoryCell] - Custom content for the memory cell.
 * @param {React.ReactNode} [cpuCell] - Custom content for the CPU cell.
 * @param {React.ReactNode} [statusCell] - Custom content for the status cell.
 * @param {React.ReactNode} [groupResourcesCell] - Custom content for the group resources cell.
 * @param {boolean} [hideAlerts=false] - Whether to hide alert information.
 * @param {boolean} [noPods=false] - Whether to hide pods' details.
 * @param {React.ReactNode} [children] - Sub-components or group items to render inside this row.
 *
 * @example
 * ```tsx
 * const node = getNode(); // Custom function to fetch or define a Node object
 * const selectedIds = ['node-1'];
 * const onSelect = (ids) => console.log('Selected IDs:', ids);
 *
 * <DataList aria-label="Topology List View">
 *   <TopologyListViewNode
 *     item={node}
 *     selectedIds={selectedIds}
 *     onSelect={onSelect}
 *     badgeCell={<CustomBadge />}
 *     labelCell={<CustomLabel />}
 *     alertsCell={<CustomAlerts />}
 *     hideAlerts={false}
 *     noPods={false}
 *   />
 * </DataList>
 * ```
 */
export const TopologyListViewNode: React.FC<TopologyListViewNodeProps> = require('@console/topology/src/components/list-view/TopologyListViewNode')
  .default;

/**
 * Retrieves the edges connecting topology nodes based on annotations in the provided resource (`resource`)
 * and a set of available resources.
 *
 * @param {K8sResourceKind} resource - The primary resource whose edges need to be determined.
 * @param {K8sResourceKind[]} resources - A list of Kubernetes resources to search for connections.
 * @returns {EdgeModel[]} An array of edge models representing connections between nodes.
 *
 * @example
 * ```tsx
 * const resource = {
 *   metadata: {
 *     annotations: { 'app.openshift.io/connects-to': 'resourceName' },
 *     uid: '12345',
 *   },
 * };
 * const resources = [
 *   { metadata: { name: 'resourceName', uid: '67890', labels: { 'app.kubernetes.io/instance': 'resourceName' } } },
 * ];
 * const edges = getTopologyEdgeItems(resource, resources);
 * ```
 */
export const getTopologyEdgeItems: GetTopologyEdgeItems = require('@console/topology/src/data-transforms/transform-utils')
  .getTopologyEdgeItems;

/**
 * Creates a topology group node based on the labels of the provided Kubernetes resource (`resource`).
 *
 * @param {K8sResourceKind} resource - The resource to evaluate for group information.
 * @returns {NodeModel | null} A group node model if the resource belongs to a group; otherwise, `null`.
 *
 * @example
 * ```tsx
 * const resource = {
 *   metadata: {
 *     labels: { 'app.kubernetes.io/part-of': 'my-group' },
 *     uid: '12345',
 *   },
 * };
 * const groupNode = getTopologyGroupItems(resource);
 * ```
 */
export const getTopologyGroupItems: GetTopologyGroupItems = require('@console/topology/src/data-transforms/transform-utils')
  .getTopologyGroupItems;

/**
 * Creates a node data graph for a topology item based on the provided resource and other optional parameters.
 *
 * @param {K8sResourceKind} resource - The Kubernetes resource representing the topology node.
 * @param {string} type - The type of the node.
 * @param {any} data - Additional data to attach to the node model.
 * @param {OdcNodeModel} [nodeProps] - Optional additional properties for the node model (excluding 'type', 'data', 'children', 'id', and 'label').
 * @param {string[]} [children] - An array of child node IDs to associate with this node.
 * @param {K8sResourceKindReference} [resourceKind] - The resource kind reference (optional).
 * @param {NodeShape} [shape] - The shape of the node (optional).
 * @returns {OdcNodeModel} The generated node model for the topology item.
 *
 * @example
 * ```tsx
 * const resource = {
 *   metadata: {
 *     uid: '1234',
 *     name: 'my-node',
 *     labels: { 'app.openshift.io/instance': 'my-instance' },
 *   },
 * };
 * const data = { someData: true };
 * const node = getTopologyNodeItem(resource, 'pod', data, undefined, ['child1'], 'PodKind');
 * ```
 */
export const getTopologyNodeItem: GetTopologyNodeItem = require('@console/topology/src/data-transforms/transform-utils')
  .getTopologyNodeItem;

/**
 * Merges a new group node into the existing groups, ensuring that no children are duplicated across groups.
 * The function updates the `children` of existing groups and, if necessary, adds the new group to the collection.
 *
 * @param {NodeModel} newGroup - The new group to be merged into the existing groups.
 * @param {NodeModel[]} existingGroups - The array of groups into which the new group should be merged.
 *
 * @example
 * ```tsx
 * const newGroup = {
 *   id: 'group1',
 *   group: true,
 *   children: ['child1', 'child2'],
 * };
 * const existingGroups = [
 *   { id: 'group1', group: true, children: ['child3'] },
 * ];
 * mergeGroup(newGroup, existingGroups);
 * ```
 */
export const mergeGroup: MergeGroup = require('@console/topology/src/data-transforms/transform-utils')
  .mergeGroup;
