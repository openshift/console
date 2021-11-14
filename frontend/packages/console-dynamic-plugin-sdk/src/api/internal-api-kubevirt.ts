/* eslint-disable prefer-destructuring */
/* eslint-disable import/order */
/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable global-require */
import * as React from 'react';
import { RouteComponentProps } from 'react-router-dom';
import { DashboardItemProps } from '@console/internal/components/dashboard/with-dashboard-resources';
import {
  AccessReviewResourceAttributes,
  Action,
  K8sResourceKindReference,
  PageComponentProps,
} from '../extensions';
import { K8sResourceCommon } from '../extensions/console-types';
import { DisplayFilters, TopologyDataResources } from '../extensions/topology-types';
import { K8sModel, MatchLabels, Selector as SelectorKind } from './common-types';
import { TimestampProps } from '@console/internal/components/utils';
import { RootState } from '@console/internal/redux';
import { AnyAction, Store } from 'redux';

export { RequestSizeInput } from '@console/internal/components/utils/request-size-input';
export { ActivityItem } from './internal-api';
export { default as ResourceDropdown } from '@console/shared/src/components/dropdown/ResourceDropdown';

export const InternalReduxStore: Store<RootState, AnyAction> = require('@console/internal/redux')
  .default;

export const {
  navFactory,
}: { navFactory: NavFactory } = require('@console/internal/components/utils/horizontal-nav');

export const {
  NodeLink,
}: {
  NodeLink: React.ComponentType<
    Omit<
      {
        name: string;
        flags: { [key: string]: boolean };
      },
      'flags'
    >
  > & {
    WrappedComponent: React.ComponentType<{
      name: string;
      flags: { [key: string]: boolean };
    }>;
  };
} = require('@console/internal/components/utils');

// @console/app
export const {
  CommonActionFactory,
}: {
  CommonActionFactory: ResourceActionFactory;
} = require('@console/app/src/actions/creators/common-factory');

// @console/internal/components
export const {
  useK8sGet,
}: {
  useK8sGet: <R extends K8sResourceCommon = K8sResourceCommon>(
    kind: K8sModel,
    name?: string,
    namespace?: string,
    opts?: {
      [k: string]: string;
    },
  ) => [R, boolean, any];
} = require('@console/internal/components/utils/k8s-get-hook');

export const useMultipleAccessReviews: (
  multipleResourceAttributes: AccessReviewResourceAttributes[],
  impersonate?: boolean,
) => [AccessReviewsResult[], boolean] = require('@console/internal/components/utils/rbac')
  .useMultipleAccessReviews;

export const {
  getSwaggerDefinitions,
  getPropertyDescription,
}: {
  getSwaggerDefinitions: () => SwaggerDefinitions;
  getPropertyDescription: (kindObj: K8sModel, propertyPath: string | string[]) => string;
} = require('@console/internal/module/k8s/swagger');
export const {
  openAPItoJSONSchema,
}: {
  openAPItoJSONSchema: (
    openAPI: any,
  ) => {
    definitions: {};
    oneOf: any[];
  };
} = require('@console/internal/module/k8s/openapi-to-json-schema');

export const withDashboardResources: <P extends DashboardItemProps>(
  WrappedComponent: React.ComponentType<P>,
) => React.ComponentClass<
  P
> = require('@console/internal/components/dashboard/with-dashboard-resources')
  .withDashboardResources;

export const {
  withStartGuide,
}: {
  withStartGuide: <P>(
    WrappedComponent: React.ComponentType<P & { noProjectsAvailable?: boolean }>,
    disable?: boolean,
  ) => React.ComponentType<P>;
} = require('@console/internal/components/start-guide');

export const CreateConnector = React.lazy(() =>
  import('@console/topology/src/components/graph-view').then((m) => ({
    default: m.CreateConnector,
  })),
);

export const NodeShadows = React.lazy(() =>
  import('@console/topology/src/components/graph-view').then((m) => ({
    default: m.NodeShadows,
  })),
);

export const useAllowEdgeCreation: () => boolean = require('@console/topology/src/filters/useAllowEdgeCreation')
  .useAllowEdgeCreation;

export const useDisplayFilters: () => DisplayFilters = require('@console/topology/src/filters/useDisplayFilters')
  .useDisplayFilters;

export const useSearchFilter: (
  text: string,
) => [boolean, string] = require('@console/topology/src/filters/useSearchFilter').useSearchFilter;

export const workloadActions: (
  contextMenuResource: K8sResourceKind,
  allowRegroup?: boolean,
  resources?: TopologyDataResources,
  isOperatorBacked?: boolean,
) => KebabOption[] = require('@console/topology/src/actions/workloadActions').workloadActions;

export const {
  BlueInfoCircleIcon,
  ErrorStatus,
  PendingStatus,
  ProgressStatus,
  RedExclamationCircleIcon,
  SuccessStatus,
  WarningStatus,
  InfoStatus,
  YellowExclamationTriangleIcon,
}: {
  BlueInfoCircleIcon: React.FC<ColoredIconProps>;
  RedExclamationCircleIcon: React.FC<ColoredIconProps>;
  YellowExclamationTriangleIcon: React.FC<ColoredIconProps>;
  ErrorStatus: React.FC<StatusComponentProps>;
  PendingStatus: React.FC<StatusComponentProps>;
  ProgressStatus: React.FC<StatusComponentProps>;
  SuccessStatus: React.FC<StatusComponentProps>;
  WarningStatus: React.FC<StatusComponentProps>;
  InfoStatus: React.FC<StatusComponentProps>;
  StatusIconAndText: React.FC<
    StatusComponentProps & {
      icon?: React.ReactElement;
      spin?: boolean;
    }
  >;
} = require('@console/shared/src/components/status');

export const GreenCheckCircleIcon: React.FC<ColoredIconProps> = require('@console/shared/src/components/status/icons')
  .GreenCheckCircleIcon;

export const StorageClassDropdown: (
  props: any,
) => JSX.Element = require('@console/internal/components/utils/storage-class-dropdown')
  .StorageClassDropdown;

export const {
  createModal,
  createModalLauncher,
}: {
  createModal: (getModalContainer: GetModalContainer) => { result: Promise<any> };
  createModalLauncher: CreateModalLauncher;
} = require('@console/internal/components/factory/modal');
export const {
  confirmModal,
}: {
  confirmModal: (
    props: any,
  ) => {
    result: Promise<{}>;
  };
} = require('@console/internal/components/modals/confirm-modal');
export const {
  createProjectModal,
}: {
  createProjectModal: (
    props: ModalComponentProps & CreateModalLauncherProps & { onSubmit: (newProject: any) => void },
  ) => {
    result: Promise<{}>;
  };
} = require('@console/internal/components/modals/create-namespace-modal');
export const {
  resourcePath,
  useAccessReview,
  useAccessReview2,
}: {
  resourcePath: (kind: K8sResourceKindReference, name?: string, namespace?: string) => string;
  useAccessReview: (
    resourceAttributes: AccessReviewResourceAttributes,
    impersonate?: any,
  ) => boolean;
  useAccessReview2: (
    resourceAttributes: AccessReviewResourceAttributes,
    impersonate?: any,
  ) => [boolean, boolean];
} = require('@console/internal/components/utils/index');
export const {
  modelFor,
  modelForGroupKind,
}: {
  modelFor: (ref: K8sResourceKindReference) => K8sModel;
  modelForGroupKind: (group: string, kind: string) => K8sModel;
} = require('@console/internal/module/k8s/k8s-models');
export const {
  Firehose,
}: {
  Firehose: React.ComponentClass<
    Omit<
      {
        k8sModels?: Map<string, any>;
        doNotConnectToState?: boolean;
      },
      'k8sModels'
    > & {
      resources: any;
    }
  > & {
    WrappedComponent: React.Component<{
      k8sModels?: Map<string, any>;
      doNotConnectToState?: boolean;
    }>;
  };
} = require('@console/internal/components/utils/firehose');

export const {
  getImageForIconClass,
}: {
  getImageForIconClass: (iconClass: string) => string;
} = require('@console/internal/components/catalog/catalog-item-icon');

export const connectToFlags: ConnectToFlags = require('@console/internal/reducers/connectToFlags')
  .connectToFlags;

export const connectToPlural: ConnectToPlural = require('@console/internal/kinds').connectToPlural;

export const NamespaceBar: React.FC<{
  children?: React.ReactNode;
  disabled?: boolean;
  onNamespaceChange?: Function;
  hideProjects?: boolean;
}> = require('@console/internal/components/namespace').NamespaceBar;

export const useActiveNamespace: () => [
  string,
  (ns: string) => void,
] = require('@console/shared/src/hooks/useActiveNamespace').useActiveNamespace;

export const useFlag: (flag: string) => boolean = require('@console/shared/src/hooks/flag').useFlag;

// react lazy
export const YAMLEditor = React.lazy(() =>
  import('@console/shared/src/components/editor/YAMLEditor'),
);

export const Table = React.lazy(() =>
  import('@console/internal/components/factory/table').then((m) => ({ default: m.Table })),
);
export const TableData = React.lazy(() =>
  import('@console/internal/components/factory/table').then((m) => ({ default: m.TableData })),
);

export const DetailsPage = React.lazy(() =>
  import('@console/internal/components/factory/details').then((m) => ({
    default: m.DetailsPage,
  })),
);

export const ListPage = React.lazy(() =>
  import('@console/internal/components/factory/list-page').then((m) => ({
    default: m.ListPage,
  })),
);

export const MultiListPage = React.lazy(() =>
  import('@console/internal/components/factory/list-page').then((m) => ({
    default: m.MultiListPage,
  })),
);

export const TopologyListViewNode = React.lazy(() =>
  import('@console/topology/src/components/list-view/TopologyListViewNode'),
);

export const Kebab: any = require('@console/internal/components/utils').Kebab;

export const ResourceIcon = React.lazy(() =>
  import('@console/internal/components/utils').then((m) => ({
    default: m.ResourceIcon,
  })),
);

export const LabelList = React.lazy(() =>
  import('@console/internal/components/utils').then((m) => ({
    default: m.LabelList,
  })),
);

export const ListDropdown = React.lazy(() =>
  import('@console/internal/components/utils').then((m) => ({
    default: m.ListDropdown,
  })),
);

export const ResourceSummary = React.lazy(() =>
  import('@console/internal/components/utils').then((m) => ({
    default: m.ResourceSummary,
  })),
);

export const ResourceName = React.lazy(() =>
  import('@console/internal/components/utils').then((m) => ({
    default: m.ResourceName,
  })),
);

export const ResourceKebab = React.lazy(() =>
  import('@console/internal/components/utils').then((m) => ({
    default: m.ResourceKebab,
  })),
);

export const Dropdown = React.lazy(() =>
  import('@console/internal/components/utils').then((m) => ({
    default: m.Dropdown,
  })),
);

export const StatusBox = React.lazy(() =>
  import('@console/internal/components/utils').then((m) => ({
    default: m.StatusBox,
  })),
);

export const Selector = React.lazy(() =>
  import('@console/internal/components/utils').then((m) => ({
    default: m.Selector,
  })),
);

export const Timestamp: React.ComponentClass<Omit<
  TimestampProps,
  'now'
>> = require('@console/internal/components/utils').Timestamp;

export const DashboardCardLink = React.lazy(() =>
  import('@console/shared/src/components/dashboard/dashboard-card/DashboardCardLink'),
);

export const GenericStatus = React.lazy(() =>
  import('@console/shared/src/components/status/GenericStatus'),
);

export const EventItem = React.lazy(() =>
  import('@console/shared/src/components/dashboard/activity-card/EventItem'),
);

export const InventoryItem = React.lazy(() =>
  import('@console/shared/src/components/dashboard/inventory-card/InventoryItem').then((m) => ({
    default: m.InventoryItem,
  })),
);

export const CpuCellComponent = React.lazy(() =>
  import('@console/topology/src/components/list-view').then((m) => ({
    default: m.CpuCellComponent,
  })),
);

export const MemoryCellComponent = React.lazy(() =>
  import('@console/topology/src/components/list-view').then((m) => ({
    default: m.MemoryCellComponent,
  })),
);

export const ModalErrorContent = React.lazy(() =>
  import('@console/internal/components/modals/error-modal').then((m) => ({
    default: m.ModalErrorContent,
  })),
);

export const ResourcesEventStream = React.lazy(() =>
  import('@console/internal/components/events').then((m) => ({
    default: m.ResourcesEventStream,
  })),
);

export const ServicesList = React.lazy(() =>
  import('@console/internal/components/service').then((m) => ({
    default: m.ServicesList,
  })),
);

export const ErrorPage404 = React.lazy(() =>
  import('@console/internal/components/error').then((m) => ({
    default: m.ErrorPage404,
  })),
);

export const Conditions = React.lazy(() =>
  import('@console/internal/components/conditions').then((m) => ({
    default: m.Conditions,
  })),
);

export const ActivityProgress = React.lazy(() =>
  import('@console/shared/src/components/dashboard/activity-card/ActivityItem').then((m) => ({
    default: m.ActivityProgress,
  })),
);

export const DroppableEditYAML = React.lazy(() =>
  import('@console/internal/components/droppable-edit-yaml').then((m) => ({
    default: m.DroppableEditYAML,
  })),
);

export const EnvFromEditor = React.lazy(() =>
  import('@console/internal/components/utils/name-value-editor.jsx').then((m) => ({
    default: m.EnvFromEditor,
  })),
);

export {
  PrometheusUtilizationItem,
  PrometheusMultilineUtilizationItem,
} from '@console/internal/components/dashboard/dashboards-page/cluster-dashboard/utilization-card';

export const RecentEventsBodyContent = React.lazy(() =>
  import('@console/shared/src/components/dashboard/activity-card/ActivityBody').then((m) => ({
    default: m.RecentEventsBodyContent,
  })),
);

export const VirtualizedGrid = React.lazy(() =>
  import('@console/shared/src/components/virtualized-grid/VirtualizedGrid'),
);
// types

type SwaggerDefinition = {
  definitions?: SwaggerDefinitions;
  description?: string;
  type?: string;
  enum?: string[];
  $ref?: string;
  items?: SwaggerDefinition;
  required?: string[];
  properties?: {
    [prop: string]: SwaggerDefinition;
  };
};

type SwaggerDefinitions = {
  [name: string]: SwaggerDefinition;
};

type ResourceActionCreator = (
  kind: K8sModel,
  obj: K8sResourceKind,
  relatedResource?: K8sResourceKind,
) => Action;

type ResourceActionFactory = { [name: string]: ResourceActionCreator };

type K8sResourceKind = K8sResourceCommon & {
  spec?: {
    selector?: SelectorKind | MatchLabels;
    [key: string]: any;
  };
  status?: { [key: string]: any };
  data?: { [key: string]: any };
};

type ColoredIconProps = {
  className?: string;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
};

type StatusComponentProps = {
  title?: string;
  iconOnly?: boolean;
  noTooltip?: boolean;
  className?: string;
  popoverTitle?: string;
};

type ModalComponentProps = {
  cancel?: () => void;
  close?: () => void;
};
type CreateModalLauncherProps = {
  blocking?: boolean;
  modalClassName?: string;
};
type GetModalContainer = (onClose: (e?: React.SyntheticEvent) => void) => React.ReactElement;
type CreateModalLauncher = <P extends ModalComponentProps>(
  C: React.ComponentType<P>,
) => (props: P & CreateModalLauncherProps) => { result: Promise<{}> };
export interface DragOperationWithType {
  type: string;
}

export type NavPage = {
  href?: string;
  path?: string;
  name: string;
  component: React.ComponentType<RouteComponentProps>;
};

export type Page<D = any> = Partial<Omit<NavPage, 'component'>> & {
  component?: React.ComponentType<PageComponentProps & D>;
  badge?: React.ReactNode;
  pageData?: D;
  nameKey?: string;
};

type NavFactory = { [name: string]: (c?: React.ComponentType<any>) => Page };

export type KebabOption = {
  hidden?: boolean;
  label?: React.ReactNode;
  labelKey?: string;
  labelKind?: { [key: string]: string | string[] };
  href?: string;
  callback?: () => any;
  accessReview?: AccessReviewResourceAttributes;
  isDisabled?: boolean;
  tooltip?: string;
  tooltipKey?: string;
  // a `/` separated string where each segment denotes a new sub menu entry
  // Eg. `Menu 1/Menu 2/Menu 3`
  path?: string;
  pathKey?: string;
  icon?: React.ReactNode;
};

export type FlagsObject = { [key: string]: boolean };

export type WithFlagsProps = {
  flags: FlagsObject;
};

export type ConnectToFlags = <P extends WithFlagsProps>(
  ...flags: string[]
) => (
  C: React.ComponentType<P>,
) => React.ComponentType<Omit<P, keyof WithFlagsProps>> & {
  WrappedComponent: React.ComponentType<P>;
};

type WithPluralProps = {
  kindObj?: K8sModel;
  modelRef?: K8sResourceKindReference;
  kindsInFlight?: boolean;
};

export type ConnectToPlural = <P extends WithPluralProps>(
  C: React.ComponentType<P>,
) => React.ComponentType<Omit<P, keyof WithPluralProps>> & {
  WrappedComponent: React.ComponentType<P>;
};

type AccessReviewsResult = {
  resourceAttributes: AccessReviewResourceAttributes;
  allowed: boolean;
};
