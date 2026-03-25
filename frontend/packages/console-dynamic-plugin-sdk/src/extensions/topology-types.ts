import type { ComponentType, ReactElement, ReactNode, Ref, FC } from 'react';
import type {
  Graph,
  Node,
  Model,
  EdgeModel,
  NodeModel,
  EventListener,
  ModelKind,
  GraphElement,
  TopologyQuadrant,
  NodeShape,
  WithSelectionProps,
  WithDragNodeProps,
  WithDndDropProps,
  WithContextMenuProps,
  BadgeLocation,
  NodeStatus,
  withContextMenu,
  DragEvent,
  DragObjectWithType,
  DragOperationWithType,
  ConnectorChoice,
} from '@patternfly/react-topology';
import type PFPoint from '@patternfly/react-topology/dist/esm/geom/Point';
import type { Alerts, K8sKind, K8sVerb, PrometheusAlert } from '../api/common-types';
import type { ActionContext } from '../api/internal-types';
import type { Action } from './actions';
import type {
  K8sResourceCommon,
  K8sResourceKind,
  K8sResourceKindReference,
  NamespaceMetrics,
  PodRCData,
  WatchK8sResults,
} from './console-types';

export type Point = [number, number];

export interface OdcNodeModel extends NodeModel {
  resource?: K8sResourceCommon;
  resourceKind?: K8sResourceKindReference;
}

export interface OdcEdgeModel extends EdgeModel {
  resource?: K8sResourceCommon;
  resourceKind?: K8sResourceKindReference;
}

export type TopologyResourcesObject = { [key: string]: K8sResourceKind[] };

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
) => ComponentType<{ element: GraphElement }> | undefined;

export type TopologyDataModelDepicted = (resource: K8sResourceCommon, model: Model) => boolean;

export type TopologyDataModelReconciler = (model: Model, resources: TopologyDataResources) => void;

export type CreateConnection = (
  source: Node,
  target: Node | Graph,
) => Promise<ReactElement[] | null>;

export type CreateConnectionGetter = (
  createHints: string[],
  source?: Node,
  target?: Node,
) => CreateConnection;

export type RelationshipProviderProvides = (source: Node, target: Node) => Promise<boolean>;

export type RelationshipProviderCreate = (source: Node, target: Node) => Promise<void>;

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

export type OverviewItem<T = K8sResourceKind> = {
  obj: T;
  hpas?: K8sResourceKind[];
  isOperatorBackedService?: boolean;
  isMonitorable?: boolean;
  monitoringAlerts?: PrometheusAlert[];
};

export type DisplayFilters = TopologyDisplayOption[];

// Applies the filters on the model and returns the ids of filters that were relevant
export type TopologyApplyDisplayOptions = (model: Model, filters: DisplayFilters) => string[];

export type TopologyDecoratorGetter = (
  element: Node,
  radius: number,
  centerX: number,
  centerY: number,
) => ReactElement;

export type TopologyDecorator = {
  id: string;
  priority: number;
  quadrant: TopologyQuadrant;
  decorator: TopologyDecoratorGetter;
};

export interface TopologyDataObject<D = {}> {
  id: string;
  name: string;
  type: string;
  resources: OverviewItem;
  pods?: K8sResourceKind[];
  data: D;
  resource: K8sResourceKind | null;
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

export type BuildConfigOverviewItem = K8sResourceCommon & {
  builds: K8sResourceCommon[];
};

export type BuildConfigData = {
  loaded: boolean;
  loadError: string;
  buildConfigs: BuildConfigOverviewItem[];
};

export const SHOW_GROUPING_HINT_EVENT = 'show-regroup-hint';
export type ShowGroupingHintEventListener = EventListener<[Node, string]>;

export type MetricsTooltipProps = {
  metricLabel: string;
  byPod: {
    formattedValue: string;
    name: string;
    value: number;
  }[];
};

export type CpuCellComponentProps = {
  cpuByPod: MetricsTooltipProps['byPod'];
  totalCores: number;
};

export type MemoryCellComponentProps = {
  memoryByPod: MetricsTooltipProps['byPod'];
  totalBytes: number;
};

export type TopologyListViewNodeProps = {
  item: Node;
  selectedIds: string[];
  onSelect: (ids: string[]) => void;
  badgeCell?: ReactNode;
  labelCell?: ReactNode;
  alertsCell?: ReactNode;
  memoryCell?: ReactNode;
  cpuCell?: ReactNode;
  statusCell?: ReactNode;
  groupResourcesCell?: ReactNode;
  hideAlerts?: boolean;
  noPods?: boolean;
  children?: ReactNode;
};

export type UseOverviewMetrics = () => any;

export type WithEditReviewAccessComponentProps = { element: Node };

export type WithEditReviewAccess = (
  verb: K8sVerb,
) => (WrappedComponent: ComponentType) => ComponentType<WithEditReviewAccessComponentProps>;

export type PodStats = {
  name: string;
  value: number;
  formattedValue: string;
};

export type MetricStats = {
  totalBytes?: number;
  totalCores?: number;
  memoryByPod?: PodStats[];
  cpuByPod?: PodStats[];
};

export type GetPodMetricStats = (metrics: NamespaceMetrics, podData: PodRCData) => MetricStats;

export type GetTopologyResourceObject = (topologyObject: TopologyDataObject) => K8sResourceKind;

export type GetResource = <T extends K8sResourceKind = K8sResourceKind>(node: GraphElement) => T;

export type GetTopologyEdgeItems = (
  resource: K8sResourceKind,
  resources: K8sResourceKind[],
) => EdgeModel[];

export type GetTopologyGroupItems = (resource: K8sResourceKind) => NodeModel | null;

export type GetTopologyNodeItem = (
  resource: K8sResourceKind,
  type: string,
  data: any,
  nodeProps?: Omit<OdcNodeModel, 'type' | 'data' | 'children' | 'id' | 'label'>,
  children?: string[],
  resourceKind?: K8sResourceKindReference,
  shape?: NodeShape,
) => OdcNodeModel;

export type MergeGroup = (newGroup: NodeModel, existingGroups: NodeModel[]) => void;

export type GetModifyApplicationAction = (
  kind: K8sKind,
  obj: K8sResourceKind,
  insertBefore?: string | string[],
) => Action;

export type BaseDataModelGetter = (
  model: Model,
  resources: TopologyDataResources,
  workloadResources: K8sResourceKind[],
  dataModelDepicters?: TopologyDataModelDepicted[],
  trafficData?: TrafficData,
  monitoringAlerts?: Alerts,
) => Model;

export interface KindsMap {
  [key: string]: string;
}
export type GetWorkloadResources = (
  resources: TopologyDataResources,
  kindsMap: KindsMap,
  workloadTypes?: string[],
) => K8sResourceKind[];

export type ContextMenuActions = (element: GraphElement) => Record<string, unknown>;

export type CreateConnectorProps = {
  startPoint: PFPoint;
  endPoint: PFPoint;
  hints: string[];
  dragging?: boolean;
  hover?: boolean;
};

export interface WithCreateConnectorProps {
  onShowCreateConnector: () => void;
  onHideCreateConnector: () => void;
  createConnectorDrag: boolean;
}

export type WorkloadNodeProps = {
  element: Node;
  dragging?: boolean;
  highlight?: boolean;
  canDrop?: boolean;
  dropTarget?: boolean;
  urlAnchorRef?: Ref<SVGCircleElement>;
  dropTooltip?: ReactNode;
} & WithSelectionProps &
  WithDragNodeProps &
  WithDndDropProps &
  WithContextMenuProps &
  WithCreateConnectorProps;

export interface PodSetProps {
  size: number;
  data: PodRCData;
  showPodCount?: boolean;
  x?: number;
  y?: number;
}

export type BaseNodeProps = {
  className?: string;
  innerRadius?: number;
  icon?: string;
  kind?: string;
  labelIconClass?: string; // Icon to show in label
  labelIcon?: ReactNode;
  labelIconPadding?: number;
  badge?: string;
  badgeColor?: string;
  badgeTextColor?: string;
  badgeBorderColor?: string;
  badgeClassName?: string;
  badgeLocation?: BadgeLocation;
  children?: ReactNode;
  attachments?: ReactNode;
  element: Node;
  hoverRef?: (node: Element) => () => void;
  dragging?: boolean;
  dropTarget?: boolean;
  canDrop?: boolean;
  createConnectorAccessVerb?: K8sVerb;
  nodeStatus?: NodeStatus;
  showStatusBackground?: boolean;
  alertVariant?: NodeStatus;
} & Partial<WithSelectionProps> &
  Partial<WithDragNodeProps> &
  Partial<WithDndDropProps> &
  Partial<WithContextMenuProps> &
  Partial<WithCreateConnectorProps>;

export type WithContextMenu = <E extends GraphElement>(
  actions: (element: E) => ActionContext,
) => ReturnType<typeof withContextMenu>;

export interface ElementProps {
  element: Node;
}

export interface CreateConnectorOptions {
  handleAngle?: number;
  handleAngleTop?: number;
  handleLength?: number;
  dragItem?: DragObjectWithType;
  dragOperation?: DragOperationWithType;
  hideConnectorMenu?: boolean;
}

interface ConnectorComponentProps {
  startPoint: PFPoint;
  endPoint: PFPoint;
  hints: string[];
  dragging: boolean;
  hover?: boolean;
}

type CreateConnectorRenderer = ComponentType<ConnectorComponentProps>;

type OnCreateResult = ConnectorChoice[] | void | undefined | null | ReactElement[];

type CreateConnectorWidgetProps = {
  element: Node;
  onKeepAlive: (isAlive: boolean) => void;
  onCreate: (
    element: Node,
    target: Node | Graph,
    event: DragEvent,
    dropHints?: string[] | undefined,
    choice?: ConnectorChoice,
  ) => Promise<OnCreateResult> | OnCreateResult;
  ConnectorComponent: CreateConnectorRenderer;
  contextMenuClass?: string;
} & CreateConnectorOptions;

export type WithCreateConnector = <P extends WithCreateConnectorProps & ElementProps>(
  onCreate: CreateConnectorWidgetProps['onCreate'],
  ConnectorComponent?: CreateConnectorRenderer,
  contextMenuClass?: string,
  options?: CreateConnectorOptions,
) => (WrappedComponent: ComponentType<Partial<P>>) => FC<Omit<P, keyof WithCreateConnectorProps>>;

export interface OdcBaseNodeInterface extends Node<OdcNodeModel> {
  resource?: K8sResourceKind;
  resourceKind?: K8sResourceKindReference;

  getResource(): K8sResourceKind | undefined;
  setResource(resource: K8sResourceKind | undefined): void;

  getResourceKind(): K8sResourceKindReference | undefined;
  setResourceKind(kind: K8sResourceKindReference | undefined): void;

  setModel(model: OdcNodeModel): void;
}

export type OdcBaseNodeConstructor = new () => OdcBaseNodeInterface;

export interface PodRingSetProps {
  obj: K8sResourceKind;
  path: string;
  impersonate?: string;
}
