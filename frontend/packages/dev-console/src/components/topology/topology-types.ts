import { ComponentType } from 'react';
import { K8sResourceKind, ObjectMetadata } from '@console/internal/module/k8s';

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

export interface Pod {
  id: string;
  name: string;
  kind: string;
  metadata: {};
  status: { phase: string };
  spec: {};
}

export interface TopologyDataObject<D = {}> {
  id: string;
  name: string;
  type: string;
  resources: ResourceProps[];
  pods: K8sResourceKind[];
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
};

export type NodeProps<D = {}> = ViewNode &
  Selectable & {
    data?: TopologyDataObject<D>;
  };

export type EdgeProps<D = {}> = ViewEdge & {
  data?: TopologyDataObject<D>;
};

export type GroupProps = ViewGroup;

export type NodeProvider = (string) => ComponentType<NodeProps>;

export type EdgeProvider = (string) => ComponentType<EdgeProps>;

export type GroupProvider = (string) => ComponentType<GroupProps>;
