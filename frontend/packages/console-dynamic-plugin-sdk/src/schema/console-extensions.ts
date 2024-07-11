import { SupportedActionExtensions } from '../extensions/actions';
import { AddAction, AddActionGroup } from '../extensions/add-actions';
import { SupportedCatalogExtensions } from '../extensions/catalog';
import {
  ClusterOverviewInventoryItem,
  ClusterOverviewUtilizationItem,
  ClusterOverviewMultilineUtilizationItem,
  CustomOverviewDetailItem,
  OverviewDetailItem,
} from '../extensions/cluster-overview';
import { ClusterGlobalConfig } from '../extensions/cluster-settings';
import { ContextProvider } from '../extensions/context-providers';
import { CreateProjectModal } from '../extensions/create-project-modal';
import { CreateResource } from '../extensions/create-resource';
import { CustomExtension } from '../extensions/custom';
import {
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
import { DetailsItem } from '../extensions/details-item';
import {
  FeatureFlag,
  ModelFeatureFlag,
  FeatureFlagHookProvider,
} from '../extensions/feature-flags';
import { FileUpload } from '../extensions/file-upload';
import { HorizontalNavTab, NavTab } from '../extensions/horizontal-nav-tabs';
import { ImportEnvironment } from '../extensions/import-environments';
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
import { Perspective } from '../extensions/perspectives';
import {
  ProjectOverviewInventoryItem,
  ProjectOverviewUtilizationItem,
} from '../extensions/project-overview';
import { PVCCreateProp, PVCStatus, PVCAlert, PVCDelete } from '../extensions/pvc';
import { ReduxReducer } from '../extensions/redux';
import { ModelMetadata } from '../extensions/resource-metadata';
import { StorageClassProvisioner } from '../extensions/storage-class-provisioner';
import { StorageProvider } from '../extensions/storage-provider';
import { TelemetryListener } from '../extensions/telemetry';
import {
  TopologyComponentFactory,
  TopologyCreateConnector,
  TopologyDataModelFactory,
  TopologyDecoratorProvider,
  TopologyDisplayFilters,
  TopologyRelationshipProvider,
} from '../extensions/topology';
import { SupportedTopologyDetailsExtensions } from '../extensions/topology-details';
import { UserPreferenceGroup, UserPreferenceItem } from '../extensions/user-preferences';
import { YAMLTemplate } from '../extensions/yaml-templates';

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
