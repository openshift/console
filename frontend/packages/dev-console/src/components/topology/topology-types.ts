import { ComponentType } from 'react';
import { Pod, ResourceProps, Resource } from '@console/shared';
import { ObjectMetadata } from '@console/internal/module/k8s';
import { Point } from '../../utils/svg-utils';

export interface ResourceProps {
  kind: string;
  apiVersion?: string;
  metadata: ObjectMetadata;
  status: {};
  spec: {
    [key: string]: any;
  };
}

export interface Resource {
  data: ResourceProps[];
}

export interface TopologyDataResources {
  replicationControllers: Resource;
  pods: Resource;
  deploymentConfigs: Resource;
  services: Resource;
  routes: Resource;
  deployments: Resource;
  replicasets: Resource;
  buildconfigs: Resource;
  builds: Resource;
  daemonSets?: Resource;
  ksroutes?: Resource;
  configurations?: Resource;
  revisions?: Resource;
  ksservices?: Resource;
  statefulSets?: Resource;
}

export interface Node {
  id: string;
  type?: string;
  name?: string;
}

export interface Edge {
  id?: string;
  type?: string;
  source: string;
  target: string;
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

export interface TopologyDataObject<D = {}> {
  id: string;
  name: string;
  type: string;
  resources: ResourceProps[];
  pods: Pod[];
  data: D;
}

export interface WorkloadData {
  url?: string;
  editUrl?: string;
  builderImage?: string;
  kind?: string;
  isKnativeResource?: boolean;
  donutStatus: {
    pods: Pod[];
    build: ResourceProps;
  };
}

export interface GraphApi {
  zoomIn(): void;
  zoomOut(): void;
  zoomReset(): void;
  zoomFit(): void;
  resetLayout(): void;
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
  isDragging?: boolean;
  targetArrowRef?(ref: SVGPathElement): void;
};

export type GroupProps = ViewGroup & {
  dropSource?: boolean;
  dropTarget?: boolean;
  groupRef(element: GroupElementInterface): void;
};

export type NodeProvider = (string) => ComponentType<NodeProps>;

export type EdgeProvider = (string) => ComponentType<EdgeProps>;

export type GroupProvider = (string) => ComponentType<GroupProps>;
