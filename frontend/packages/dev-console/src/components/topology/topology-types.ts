import { ComponentType } from 'react';
import { FirehoseResult, KebabOption } from '@console/internal/components/utils';
import { ExtPodKind, OverviewItem, PodControllerOverviewItem } from '@console/shared';
import { DeploymentKind, K8sResourceKind, PodKind, EventKind } from '@console/internal/module/k8s';
import { Pipeline, PipelineRun } from '../../utils/pipeline-augment';
import { Node as TopologyNode, EventListener } from '@console/topology/src/types';

export type Point = [number, number];

export interface TopologyDataResources {
  replicationControllers: FirehoseResult;
  pods: FirehoseResult<PodKind[]>;
  deploymentConfigs: FirehoseResult;
  services: FirehoseResult;
  routes: FirehoseResult;
  deployments: FirehoseResult<DeploymentKind[]>;
  replicaSets: FirehoseResult;
  buildConfigs: FirehoseResult;
  builds: FirehoseResult;
  daemonSets?: FirehoseResult;
  secrets?: FirehoseResult;
  ksroutes?: FirehoseResult;
  configurations?: FirehoseResult;
  revisions?: FirehoseResult;
  ksservices?: FirehoseResult;
  statefulSets?: FirehoseResult;
  pipelines?: FirehoseResult;
  pipelineRuns?: FirehoseResult;
  eventSourceCronjob?: FirehoseResult;
  eventSourceContainers?: FirehoseResult;
  eventSourceApiserver?: FirehoseResult;
  eventSourceCamel?: FirehoseResult;
  eventSourceKafka?: FirehoseResult;
  eventSourceSinkbinding?: FirehoseResult;
  clusterServiceVersions?: FirehoseResult;
  events?: FirehoseResult<EventKind[]>;
  // TODO: Plugin?
  serviceBindingRequests?: FirehoseResult;
  virtualmachines?: FirehoseResult;
  virtualmachineinstances?: FirehoseResult;
  virtualmachinetemplates?: FirehoseResult;
  migrations?: FirehoseResult;
  dataVolumes?: FirehoseResult;
  vmImports?: FirehoseResult;
}

export interface Node {
  id: string;
  type?: string;
  name?: string;
  children?: string[];
  data?: {};
}

export interface Edge {
  id?: string;
  type?: string;
  source: string;
  target: string;
  data?: {};
}

export interface Group {
  id?: string;
  type?: string;
  name: string;
  nodes: string[];
}

export interface GraphModel {
  nodes: Node[];
  edges: Edge[];
  groups: Group[];
}

export interface TopologyDataMap {
  [id: string]: TopologyDataObject;
}

export interface TopologyDataModel {
  graph: GraphModel;
  topology: TopologyDataMap;
}

export type TopologyOverviewItem = OverviewItem & {
  pipelines?: Pipeline[];
  pipelineRuns?: PipelineRun[];
};

export interface TopologyDataObject<D = {}> {
  id: string;
  name: string;
  type: string;
  resources: OverviewItem;
  pods?: ExtPodKind[];
  data: D;
  operatorBackedService: boolean;
  groupResources?: TopologyDataObject[];
}

export interface TopologyApplicationObject {
  id: string;
  name: string;
  resources: TopologyDataObject[];
}

export interface ConnectedWorkloadPipeline {
  pipeline: Pipeline;
  pipelineRuns: PipelineRun[];
}

export interface WorkloadData {
  url?: string;
  editURL?: string;
  vcsURI?: string;
  builderImage?: string;
  kind?: string;
  isKnativeResource?: boolean;
  build: K8sResourceKind;
  donutStatus: DonutStatusData;
  connectedPipeline: ConnectedWorkloadPipeline;
}

export interface DonutStatusData {
  pods: ExtPodKind[];
  current: PodControllerOverviewItem;
  previous: PodControllerOverviewItem;
  dc: K8sResourceKind;
  isRollingOut: boolean;
}

export interface GraphApi {
  zoomIn(): void;
  zoomOut(): void;
  zoomReset(): void;
  zoomFit(): void;
  resetLayout(): void;
}

export enum GraphElementType {
  node = 'node',
  edge = 'edge',
  group = 'group',
}

export interface Selectable {
  selected?: boolean;
  onSelect?(): void;
}

export interface GroupElementInterface {
  isPointInGroup: (p: Point) => boolean;
}

export type ViewNode = {
  id: string;
  type?: string;
  x: number;
  y: number;
  size: number;
  name: string;
  fx?: number;
  fy?: number;
};

export type ViewEdge = {
  id: string;
  type?: string;
  nodeSize: number;
  source: ViewNode;
  target: ViewNode;
};

export type ViewGroup = {
  id: string;
  type?: string;
  name: string;
  nodes: ViewNode[];
  element?: GroupElementInterface;
};

export type NodeProps<D = {}> = ViewNode &
  Selectable & {
    data?: TopologyDataObject<D>;
    dragActive?: boolean;
    isDragging?: boolean;
    isTarget?: boolean;
    onHover?(hovered: boolean): void;
  };

export type DragConnectionProps = NodeProps & {
  dragX: number;
  dragY: number;
  isDragging?: boolean;
  onHover?(hovered: boolean): void;
};

export type EdgeProps<D = {}> = ViewEdge & {
  data?: TopologyDataObject<D>;
  dragActive?: boolean;
  isDragging?: boolean;
  targetArrowRef?(ref: SVGPathElement): void;
  onRemove?: () => void;
};

export type GroupProps = ViewGroup &
  Selectable & {
    dragActive?: boolean;
    dropSource?: boolean;
    dropTarget?: boolean;
    groupRef(element: GroupElementInterface): void;
  };

export type TrafficData = {
  nodes: KialiNode[];
  edges: KialiEdge[];
};

export type KialiNode = {
  data: {
    id: string;
    nodeType: string;
    namespace: string;
    workload: string;
    app: string;
    version?: string;
    destServices?: { [key: string]: any }[];
    traffic?: { [key: string]: any }[];
  };
};

export type KialiEdge = {
  data: {
    id: string;
    source: string;
    target: string;
    traffic: { [key: string]: any };
  };
};

export type NodeProvider = (type: string) => ComponentType<NodeProps>;

export type EdgeProvider = (type: string) => ComponentType<EdgeProps>;

export type GroupProvider = (type: string) => ComponentType<GroupProps>;

export type ActionProvider = (type: GraphElementType, id: string) => KebabOption[];

export type ContextMenuProvider = {
  open: (type: GraphElementType, id: string, eventX: number, eventY: number) => boolean;
};

export type GraphData = {
  namespace: string;
  createResourceAccess: string[];
  eventSourceEnabled: boolean;
};

export const SHOW_GROUPING_HINT_EVENT = 'show-regroup-hint';
export type ShowGroupingHintEventListener = EventListener<[TopologyNode, string]>;
