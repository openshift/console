import * as React from 'react';
import {
  Graph,
  Node,
  Model,
  EdgeModel,
  NodeModel,
  EventListener,
  ModelKind,
  GraphElement,
} from '@patternfly/react-topology';
import {
  K8sResourceCommon,
  K8sResourceKindReference,
  WatchK8sResults,
} from '../extensions/console-types';

export type Point = [number, number];

export interface OdcNodeModel extends NodeModel {
  resource?: K8sResourceCommon;
  resourceKind?: K8sResourceKindReference;
}

export interface OdcEdgeModel extends EdgeModel {
  resource?: K8sResourceCommon;
  resourceKind?: K8sResourceKindReference;
}

export type TopologyResourcesObject = { [key: string]: K8sResourceCommon[] };

export type TopologyDataResources = WatchK8sResults<TopologyResourcesObject>;

export type TopologyDataModelGetter = (
  namespace: string,
  resources: TopologyDataResources,
  workloads: K8sResourceCommon[],
) => Promise<Model>;

export enum TopologyViewType {
  graph = 'graph',
  list = 'list',
}
export type ViewComponentFactory = (
  kind: ModelKind,
  type: string,
  view?: TopologyViewType,
) => React.ComponentType<{ element: GraphElement }> | undefined;

export type TopologyDataModelDepicted = (resource: K8sResourceCommon, model: Model) => boolean;

export type TopologyDataModelReconciler = (model: Model, resources: TopologyDataResources) => void;

export type CreateConnection = (
  source: Node,
  target: Node | Graph,
) => Promise<React.ReactElement[] | null>;

export type CreateConnectionGetter = (
  createHints: string[],
  source?: Node,
  target?: Node,
) => CreateConnection;

export enum TopologyDisplayFilterType {
  show = 'show',
  expand = 'expand',
  kind = 'kind',
}

export type TopologyDisplayOption = {
  type: TopologyDisplayFilterType;
  id: string;
  label?: string;
  labelKey?: string;
  priority: number;
  value: boolean;
};

export const enum AlertStates {
  Firing = 'firing',
  NotFiring = 'not-firing',
  Pending = 'pending',
  Silenced = 'silenced',
}

export type PrometheusAlert = {
  activeAt?: string;
  annotations: { [key: string]: string };
  labels: { [key: string]: string };
  state: AlertStates;
  value?: number | string;
};

export type OverviewItem<T = K8sResourceCommon> = {
  obj: T;
  hpas?: K8sResourceCommon[];
  isOperatorBackedService?: boolean;
  isMonitorable?: boolean;
  monitoringAlerts?: PrometheusAlert[];
};

export type DisplayFilters = TopologyDisplayOption[];

// Applies the filters on the model and returns the ids of filters that were relevant
export type TopologyApplyDisplayOptions = (model: Model, filters: DisplayFilters) => string[];

export enum TopologyDecoratorQuadrant {
  upperLeft = 'upperLeft',
  upperRight = 'upperRight',
  lowerLeft = 'lowerLeft',
  lowerRight = 'lowerRight',
}

export type TopologyDecoratorGetter = (
  element: Node,
  radius: number,
  centerX: number,
  centerY: number,
) => React.ReactElement;

export type TopologyDecorator = {
  id: string;
  priority: number;
  quadrant: TopologyDecoratorQuadrant;
  decorator: TopologyDecoratorGetter;
};

export interface TopologyDataObject<D = {}> {
  id: string;
  name: string;
  type: string;
  resources: OverviewItem;
  pods?: K8sResourceCommon[];
  data: D;
  resource: K8sResourceCommon | null;
  groupResources?: OdcNodeModel[];
}

export interface TopologyApplicationObject {
  id: string;
  name: string;
  resources: OdcNodeModel[];
}

export interface WorkloadData {
  editURL?: string;
  vcsURI?: string;
  vcsRef?: string;
  builderImage?: string;
  kind?: string;
  isKnativeResource?: boolean;
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

export type GraphData = {
  namespace: string;
  createResourceAccess: string[];
  eventSourceEnabled: boolean;
  createConnectorExtensions?: CreateConnectionGetter[];
  decorators?: { [key: string]: TopologyDecorator[] };
};

export const SHOW_GROUPING_HINT_EVENT = 'show-regroup-hint';
export type ShowGroupingHintEventListener = EventListener<[Node, string]>;
