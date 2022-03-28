import { K8sResourceKind } from '@console/internal/module/k8s';
import {
  FirehoseResult,
  HealthState,
  K8sResourceCommon,
  LIMIT_STATE,
  ObjectReference,
  PrometheusResponse,
  StatusGroupMapper,
  TopConsumerPopoverProps,
} from '../extensions/console-types';
import { Alert, K8sModel } from './common-types';
import { K8sResourceCondition } from './k8s-types';

type WithClassNameProps<R = {}> = R & {
  className?: string;
};

export type ActivityItemProps = WithClassNameProps;

export type ActivityBodyProps = WithClassNameProps<{
  children: React.ReactNode;
}>;

export type AlertsBodyProps = WithClassNameProps<{
  error?: boolean;
}>;

export type RecentEventsBodyProps = {
  events: FirehoseResult<EventKind[]>;
  filter?: (arg: EventKind) => boolean;
  moreLink?: string;
};

type OngoingActvityProps<T> = {
  resource: T;
};

export type OngoingActivityBodyProps = {
  resourceActivities?: (OngoingActvityProps<K8sResourceCommon> & {
    timestamp: Date;
    loader?: () => Promise<React.ComponentType<Partial<OngoingActvityProps<K8sResourceCommon>>>>;
    component?: React.ComponentType<Partial<OngoingActvityProps<K8sResourceCommon>>>;
  })[];
  prometheusActivities?: {
    results: PrometheusResponse[];
    loader?: () => Promise<React.ComponentType<{ results?: PrometheusResponse[] }>>;
    component?: React.ComponentType<{ results: PrometheusResponse[] }>;
  }[];
  loaded: boolean;
};

export type AlertItemProps = {
  alert: Alert;
};

export type HealthItemProps = WithClassNameProps<{
  title: string;
  details?: string;
  state?: HealthState;
  popupTitle?: string;
  noIcon?: boolean;
  icon?: React.ReactNode;
}>;

export type ResourceInventoryItemProps = {
  resources: K8sResourceCommon[];
  additionalResources?: { [key: string]: [] };
  mapper?: StatusGroupMapper;
  kind: K8sModel;
  isLoading: boolean;
  namespace?: string;
  error: boolean;
  showLink?: boolean;
  TitleComponent?: React.ComponentType<{}>;
  title?: string;
  titlePlural?: string;
  ExpandedComponent?: React.ComponentType<{}>;
  basePath?: string;
  dataTest?: string;
};

export type DetailItemProps = {
  title: string;
  children: React.ReactNode;
  isLoading?: boolean;
  error?: boolean;
  valueClassName?: string;
  errorMessage?: string;
};

export type DetailsBodyProps = {
  children?: React.ReactNode;
};

export type UtilizationBodyProps = {
  children: React.ReactNode;
};

export enum ByteDataTypes {
  BinaryBytes = 'binaryBytes',
  BinaryBytesWithoutB = 'binaryBytesWithoutB',
  DecimalBytes = 'decimalBytes',
  DecimalBytesWithoutB = 'decimalBytesWithoutB',
}

export type UtilizationItemProps = {
  title: string;
  utilization?: PrometheusResponse;
  limit?: PrometheusResponse;
  requested?: PrometheusResponse;
  isLoading: boolean;
  // Todo(bipuladh): Make huamnize type Humanize once unit.js is converted
  humanizeValue: Function;
  query: string | string[];
  error: boolean;
  max?: number;
  byteDataType?: ByteDataTypes;
  TopConsumerPopover?: React.ComponentType<TopConsumerPopoverProps>;
  setLimitReqState?: (state: { limit: LIMIT_STATE; requested: LIMIT_STATE }) => void;
};

type EventInvolvedObject = {
  apiVersion?: string;
  kind?: string;
  name?: string;
  uid?: string;
  namespace?: string;
};

export type EventKind = {
  action?: string;
  count?: number;
  type?: string;
  involvedObject: EventInvolvedObject;
  message?: string;
  eventTime?: string;
  lastTimestamp?: string;
  firstTimestamp?: string;
  reason?: string;
  source: {
    component: string;
    host?: string;
  };
  series?: {
    count?: number;
    lastObservedTime?: string;
    state?: string;
  };
} & K8sResourceCommon;

export type UtilizationDurationDropdownProps = {
  adjustDuration?: (duration: number) => number;
};

type UtilizationDurationState = {
  duration: number;
  endDate: Date;
  selectedKey: string;
  startDate: Date;
  updateDuration: (duration: number) => void;
  updateEndDate: (endDate: Date) => void;
  updateSelectedKey: (key: string) => void;
};

export type UseUtilizationDuration = (
  adjustDuration?: (duration: number) => number,
) => UtilizationDurationState;

export enum PrometheusEndpoint {
  LABEL = 'api/v1/label',
  QUERY = 'api/v1/query',
  QUERY_RANGE = 'api/v1/query_range',
  RULES = 'api/v1/rules',
  TARGETS = 'api/v1/targets',
}

type PrometheusPollProps = {
  delay?: number;
  endpoint: PrometheusEndpoint;
  endTime?: number;
  namespace?: string;
  query: string;
  samples?: number;
  timeout?: string;
  timespan?: number;
};

export type UsePrometheusPoll = (props: PrometheusPollProps) => [PrometheusResponse, any, boolean];

export type UseActiveNamespace = () => [string, (ns: string) => void];

export type VirtualizedGridProps = {
  items: VirtualizedGridItem[] | VirtualizedGridGroupedItems;
  renderCell: VirtualizedGridRenderCell;
  /**
   * should be set when items are grouped/ `isItemGrouped` is set to true and each group has a heading
   */
  renderHeader?: VirtualizedGridRenderHeader;
  /**
   * Default value: false
   * should be set true when items are grouped
   */
  isItemsGrouped?: boolean;

  /** Grid styles */
  className?: string;

  /** Cell Measurements */
  cellWidth?: number;
  cellMargin?: number;
  celldefaultHeight?: number;
  estimatedCellHeight?: number;

  overscanRowCount?: number;
  headerHeight?: number;
};

export type VirtualizedGridItem = {
  [key: string]: any;
};

export type VirtualizedGridGroupedItems = {
  [key: string]: VirtualizedGridItem[];
};

export type VirtualizedGridRenderHeader = (heading: string) => React.ReactNode;

export type VirtualizedGridRenderCell = (item: VirtualizedGridItem) => React.ReactNode;

export type LazyActionMenuProps = {
  context: ActionContext;
  variant?: ActionMenuVariant;
  label?: string;
  isDisabled?: boolean;
};

export type ActionContext = {
  [contextId: string]: any;
};

export enum ActionMenuVariant {
  KEBAB = 'plain',
  DROPDOWN = 'default',
}

export interface Cancelable {
  cancel(): void;
  flush(): void;
}

export interface UseDebounceCallback<T> {
  callback: T;
  timeout: number;
  debounceParams: { leading?: boolean; trailing?: boolean; maxWait?: number };
}

export enum InstallPlanApproval {
  Automatic = 'Automatic',
  Manual = 'Manual',
}

export enum SubscriptionState {
  SubscriptionStateNone = '',
  SubscriptionStateFailed = 'UpgradeFailed',
  SubscriptionStateUpgradeAvailable = 'UpgradeAvailable',
  SubscriptionStateUpgradePending = 'UpgradePending',
  SubscriptionStateAtLatest = 'AtLatestKnown',
}

export type StepResource = {
  group: string;
  version: string;
  kind: string;
  name: string;
  manifest?: string;
  sourceName?: string;
  sourceNamespace?: string;
};
export type Step = {
  resolving: string;
  resource: StepResource;
  status: 'Unknown' | 'NotPresent' | 'Present' | 'Created';
};

export enum InstallPlanPhase {
  InstallPlanPhaseNone = '',
  InstallPlanPhasePlanning = 'Planning',
  InstallPlanPhaseRequiresApproval = 'RequiresApproval',
  InstallPlanPhaseInstalling = 'Installing',
  InstallPlanPhaseComplete = 'Complete',
  InstallPlanPhaseFailed = 'Failed',
}

export type InstallPlanKind = {
  spec: {
    clusterServiceVersionNames: string[];
    approval: InstallPlanApproval;
    approved?: boolean;
  };
  status?: {
    phase: InstallPlanPhase;
    catalogSources: string[];
    plan: Step[];
    conditions?: K8sResourceCondition[];
  };
} & K8sResourceCommon;

export type SubscriptionKind = {
  apiVersion: 'operators.coreos.com/v1alpha1';
  kind: 'Subscription';
  spec: {
    source: string;
    name: string;
    channel?: string;
    startingCSV?: string;
    sourceNamespace?: string;
    installPlanApproval?: InstallPlanApproval;
  };
  status?: {
    catalogHealth?: {
      catalogSourceRef?: ObjectReference;
      healthy?: boolean;
      lastUpdated?: string;
    }[];
    conditions?: K8sResourceCondition[];
    installedCSV?: string;
    installPlanRef?: ObjectReference;
    state?: SubscriptionState;
    lastUpdated?: string;
    currentCSV?: string;
  };
} & K8sResourceCommon;

export type SubscriptionStatusProps = {
  subscription: SubscriptionKind;
};

export enum ClusterServiceVersionPhase {
  CSVPhaseNone = '',
  CSVPhasePending = 'Pending',
  CSVPhaseInstallReady = 'InstallReady',
  CSVPhaseInstalling = 'Installing',
  CSVPhaseSucceeded = 'Succeeded',
  CSVPhaseFailed = 'Failed',
  CSVPhaseUnknown = 'Unknown',
  CSVPhaseReplacing = 'Replacing',
  CSVPhaseDeleting = 'Deleting',
}

export enum CSVConditionReason {
  CSVReasonRequirementsUnknown = 'RequirementsUnknown',
  CSVReasonRequirementsNotMet = 'RequirementsNotMet',
  CSVReasonRequirementsMet = 'AllRequirementsMet',
  CSVReasonOwnerConflict = 'OwnerConflict',
  CSVReasonComponentFailed = 'InstallComponentFailed',
  CSVReasonInvalidStrategy = 'InvalidInstallStrategy',
  CSVReasonWaiting = 'InstallWaiting',
  CSVReasonInstallSuccessful = 'InstallSucceeded',
  CSVReasonInstallCheckFailed = 'InstallCheckFailed',
  CSVReasonComponentUnhealthy = 'ComponentUnhealthy',
  CSVReasonBeingReplaced = 'BeingReplaced',
  CSVReasonReplaced = 'Replaced',
  CSVReasonCopied = 'Copied',
}

export enum InstallModeType {
  InstallModeTypeOwnNamespace = 'OwnNamespace',
  InstallModeTypeSingleNamespace = 'SingleNamespace',
  InstallModeTypeMultiNamespace = 'MultiNamespace',
  InstallModeTypeAllNamespaces = 'AllNamespaces',
}

export type Descriptor<T = any> = {
  path: string;
  displayName: string;
  description: string;
  'x-descriptors'?: T[];
  value?: any;
};
export type CRDDescription = {
  name: string;
  version: string;
  kind: string;
  displayName: string;
  description?: string;
  specDescriptors?: Descriptor[];
  statusDescriptors?: Descriptor[];
  resources?: {
    name?: string;
    version: string;
    kind: string;
  }[];
};

export type APIServiceDefinition = {
  name: string;
  group: string;
  version: string;
  kind: string;
  deploymentName: string;
  containerPort: number;
  displayName: string;
  description?: string;
  specDescriptors?: Descriptor[];
  statusDescriptors?: Descriptor[];
  resources?: {
    name?: string;
    version: string;
    kind: string;
  }[];
};

export type RequirementStatus = {
  group: string;
  version: string;
  kind: string;
  name: string;
  status: string;
  uuid?: string;
};
export type ClusterServiceVersionIcon = { base64data: string; mediatype: string };

export type ClusterServiceVersionKind = {
  apiVersion: 'operators.coreos.com/v1alpha1';
  kind: 'ClusterServiceVersion';
  spec: {
    install: {
      strategy: 'Deployment';
      spec: {
        permissions: {
          serviceAccountName: string;
          rules: { apiGroups: string[]; resources: string[]; verbs: string[] }[];
        }[];
        deployments: { name: string; spec: any }[];
      };
    };
    customresourcedefinitions?: { owned?: CRDDescription[]; required?: CRDDescription[] };
    apiservicedefinitions?: { owned?: APIServiceDefinition[]; required?: APIServiceDefinition[] };
    replaces?: string;
    installModes: { type: InstallModeType; supported: boolean }[];
    displayName?: string;
    description?: string;
    provider?: { name: string };
    version?: string;
    icon?: ClusterServiceVersionIcon[];
  };
  status?: {
    phase: ClusterServiceVersionPhase;
    reason: CSVConditionReason;
    requirementStatus?: RequirementStatus[];
  };
} & K8sResourceKind;

export type CatalogSourceKind = {
  apiVersion: 'operators.coreos.com/v1alpha1';
  kind: 'CatalogSource';
  spec: {
    name: string;
    sourceType: 'internal' | 'grpc' | 'configMap';
    configMap?: string;
    secrets?: string[];
    displayName?: string;
    description?: string;
    publisher?: string;
    icon?: { mediatype: string; data: string };
    updateStrategy?: { registryPoll: { interval: string } };
  };
} & K8sResourceKind;
