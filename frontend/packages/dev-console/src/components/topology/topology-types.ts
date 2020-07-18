import * as React from 'react';
import { ExtPodKind, OverviewItem, PodControllerOverviewItem } from '@console/shared';
import { K8sResourceKind } from '@console/internal/module/k8s';
import {
  Graph,
  Node,
  Model,
  EdgeModel,
  NodeModel,
  EventListener,
} from '@patternfly/react-topology';
import { WatchK8sResults } from '@console/internal/components/utils/k8s-watch-hook';
import { Pipeline, PipelineRun } from '../../utils/pipeline-augment';

export type Point = [number, number];

export interface OdcNodeModel extends NodeModel {
  resource?: K8sResourceKind;
}

export interface OdcEdgeModel extends EdgeModel {
  resource?: K8sResourceKind;
}

export type TopologyResourcesObject = { [key: string]: K8sResourceKind[] };

export type TopologyDataResources = WatchK8sResults<TopologyResourcesObject>;

export type TopologyDataModelGetter = (
  namespace: string,
  resources: TopologyDataResources,
  workloads: K8sResourceKind[],
) => Promise<Model>;

export type TopologyDataModelDepicted = (resource: K8sResourceKind, model: Model) => boolean;

export type CreateConnection = (
  source: Node,
  target: Node | Graph,
) => Promise<React.ReactElement[] | null>;

export type CreateConnectionGetter = (createHints: string[]) => CreateConnection;

export enum TopologyDisplayFilterType {
  show = 'show',
  expand = 'expand',
}

export type TopologyDisplayOption = {
  type: TopologyDisplayFilterType;
  id: string;
  label: string;
  priority: number;
  value: boolean;
};

export type DisplayFilters = TopologyDisplayOption[];

// Applies the filters on the model and returns the ids of filters that were relevant
export type TopologyApplyDisplayOptions = (model: Model, filters: DisplayFilters) => string[];

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
  resource: K8sResourceKind | null;
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

export type ConnectsToData = { apiVersion: string; kind: string; name: string };

export type GraphData = {
  namespace: string;
  createResourceAccess: string[];
  eventSourceEnabled: boolean;
  createConnectorExtensions?: CreateConnectionGetter[];
};

export const SHOW_GROUPING_HINT_EVENT = 'show-regroup-hint';
export type ShowGroupingHintEventListener = EventListener<[Node, string]>;
