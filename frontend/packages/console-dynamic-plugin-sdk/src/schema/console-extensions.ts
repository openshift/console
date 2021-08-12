import { SupportedActionExtensions } from '../extensions/actions';
import { AddAction, AddActionGroup } from '../extensions/add-actions';
import { SupportedCatalogExtensions } from '../extensions/catalog';
import { ClusterGlobalConfig } from '../extensions/cluster-settings';
import { ContextProvider } from '../extensions/context-providers';
import { CreateResource } from '../extensions/create-resource';
import {
  DashboardsTab,
  DashboardsCard,
  DashboardsOverviewHealthPrometheusSubsystem,
  DashboardsOverviewHealthURLSubsystem,
  DashboardsOverviewHealthResourceSubsystem,
  DashboardsOverviewHealthOperator,
  DashboardsInventoryItemGroup,
  DashboardsOverviewInventoryItem,
  DashboardsOverviewResourceActivity,
} from '../extensions/dashboards';
import { FeatureFlag, ModelFeatureFlag } from '../extensions/feature-flags';
import { FileUpload } from '../extensions/file-upload';
import {
  HrefNavItem,
  ResourceNSNavItem,
  ResourceClusterNavItem,
  Separator,
  NavSection,
} from '../extensions/navigation';
import { AlertAction } from '../extensions/notification-alert';
import {
  StandaloneRoutePage,
  RoutePage,
  ResourceDetailsPage,
  ResourceListPage,
  ResourceTabPage,
} from '../extensions/pages';
import { PVCCreateProp, PVCStatus, PVCAlert, PVCDelete } from '../extensions/pvc';
import { ReduxReducer } from '../extensions/redux';
import { ModelMetadata } from '../extensions/resource-metadata';
import { StorageProvider } from '../extensions/storage-provider';
import { TelemetryListener } from '../extensions/telemetry';
import {
  TopologyComponentFactory,
  TopologyCreateConnector,
  TopologyDataModelFactory,
  TopologyDecoratorProvider,
  TopologyDisplayFilters,
} from '../extensions/topology';
import { SupportedTopologyDetailsExtensions } from '../extensions/topology-details';
import { YAMLTemplate } from '../extensions/yaml-templates';

export type SupportedExtension =
  | FeatureFlag
  | ModelFeatureFlag
  | ReduxReducer
  | ContextProvider
  | StandaloneRoutePage
  | PVCCreateProp
  | PVCStatus
  | PVCAlert
  | PVCDelete
  | YAMLTemplate
  | AddAction
  | AddActionGroup
  | ClusterGlobalConfig
  | HrefNavItem
  | ResourceNSNavItem
  | ResourceClusterNavItem
  | Separator
  | NavSection
  | FileUpload
  | ModelMetadata
  | AlertAction
  | StorageProvider
  | TelemetryListener
  | SupportedCatalogExtensions
  | SupportedActionExtensions
  | SupportedTopologyDetailsExtensions
  | RoutePage
  | ResourceListPage
  | ResourceTabPage
  | ResourceDetailsPage
  | DashboardsTab
  | DashboardsCard
  | DashboardsOverviewHealthPrometheusSubsystem
  | DashboardsOverviewHealthURLSubsystem
  | DashboardsOverviewHealthResourceSubsystem
  | DashboardsOverviewHealthOperator
  | DashboardsInventoryItemGroup
  | DashboardsOverviewInventoryItem
  | DashboardsOverviewResourceActivity
  | TopologyComponentFactory
  | TopologyCreateConnector
  | TopologyDataModelFactory
  | TopologyDisplayFilters
  | TopologyDecoratorProvider
  | CreateResource;

/**
 * Schema of Console plugin's `console-extensions.json` file.
 */
export type ConsoleExtensionsJSON = SupportedExtension[];
