import type { SupportedActionExtensions } from '../extensions/actions';
import type { AddAction, AddActionGroup } from '../extensions/add-actions';
import type { SupportedCatalogExtensions } from '../extensions/catalog';
import type {
  ClusterOverviewInventoryItem,
  ClusterOverviewUtilizationItem,
  ClusterOverviewMultilineUtilizationItem,
  CustomOverviewDetailItem,
  OverviewDetailItem,
} from '../extensions/cluster-overview';
import type { ClusterGlobalConfig } from '../extensions/cluster-settings';
import type { ContextProvider } from '../extensions/context-providers';
import type { CreateProjectModal } from '../extensions/create-project-modal';
import type { CreateResource } from '../extensions/create-resource';
import type { CustomExtension } from '../extensions/custom';
import type {
  DashboardsTab,
  DashboardsCard,
  DashboardsOverviewHealthPrometheusSubsystem,
  DashboardsOverviewHealthURLSubsystem,
  DashboardsOverviewHealthResourceSubsystem,
  DashboardsOverviewHealthOperator,
  DashboardsInventoryItemGroup,
  DashboardsOverviewInventoryItem,
  DashboardsOverviewInventoryItemReplacement,
  DashboardsProjectOverviewInventoryItem,
  DashboardsOverviewResourceActivity,
  DashboardsOverviewPrometheusActivity,
} from '../extensions/dashboards';
import type { DetailsItem } from '../extensions/details-item';
import type {
  FeatureFlag,
  ModelFeatureFlag,
  FeatureFlagHookProvider,
} from '../extensions/feature-flags';
import type { FileUpload } from '../extensions/file-upload';
import type { HorizontalNavTab, NavTab } from '../extensions/horizontal-nav-tabs';
import type { ImportEnvironment } from '../extensions/import-environments';
import type {
  HrefNavItem,
  ResourceNSNavItem,
  ResourceClusterNavItem,
  Separator,
  NavSection,
} from '../extensions/navigation';
import type { AlertAction } from '../extensions/notification-alert';
import type {
  StandaloneRoutePage,
  RoutePage,
  ResourceDetailsPage,
  ResourceListPage,
} from '../extensions/pages';
import type { Perspective } from '../extensions/perspectives';
import type {
  ProjectOverviewInventoryItem,
  ProjectOverviewUtilizationItem,
} from '../extensions/project-overview';
import type { PVCCreateProp, PVCStatus, PVCAlert, PVCDelete } from '../extensions/pvc';
import type { ReduxReducer } from '../extensions/redux';
import type { ModelMetadata } from '../extensions/resource-metadata';
import type { StorageClassProvisioner } from '../extensions/storage-class-provisioner';
import type { StorageProvider } from '../extensions/storage-provider';
import type { TelemetryListener } from '../extensions/telemetry';
import type {
  TopologyComponentFactory,
  TopologyCreateConnector,
  TopologyDataModelFactory,
  TopologyDecoratorProvider,
  TopologyDisplayFilters,
  TopologyRelationshipProvider,
} from '../extensions/topology';
import type { SupportedTopologyDetailsExtensions } from '../extensions/topology-details';
import type { UserPreferenceGroup, UserPreferenceItem } from '../extensions/user-preferences';
import type { YAMLTemplate } from '../extensions/yaml-templates';

export type SupportedExtension =
  | FeatureFlag
  | ModelFeatureFlag
  | FeatureFlagHookProvider
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
  | ImportEnvironment
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
  | ResourceDetailsPage
  | DashboardsTab
  | DashboardsCard
  | DashboardsOverviewHealthPrometheusSubsystem
  | DashboardsOverviewHealthURLSubsystem
  | DashboardsOverviewHealthResourceSubsystem
  | DashboardsOverviewHealthOperator
  | DashboardsInventoryItemGroup
  | DashboardsOverviewInventoryItem
  | DashboardsOverviewInventoryItemReplacement
  | DashboardsProjectOverviewInventoryItem
  | DashboardsOverviewResourceActivity
  | DashboardsOverviewPrometheusActivity
  | TopologyComponentFactory
  | TopologyCreateConnector
  | TopologyDataModelFactory
  | TopologyDisplayFilters
  | TopologyDecoratorProvider
  | TopologyRelationshipProvider
  | CreateResource
  | CreateResource
  | UserPreferenceGroup
  | UserPreferenceItem
  | Perspective
  | HorizontalNavTab
  | NavTab
  | ClusterOverviewInventoryItem
  | ClusterOverviewUtilizationItem
  | ClusterOverviewMultilineUtilizationItem
  | OverviewDetailItem
  | CustomOverviewDetailItem
  | ProjectOverviewUtilizationItem
  | ProjectOverviewInventoryItem
  | StorageClassProvisioner
  | DetailsItem
  | CreateProjectModal;

/**
 * Schema of Console plugin's `console-extensions.json` file.
 */
export type ConsoleExtensionsJSON = (SupportedExtension | CustomExtension)[];
