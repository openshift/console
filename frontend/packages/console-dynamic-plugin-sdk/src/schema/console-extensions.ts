import { FeatureFlag, ModelFeatureFlag } from '../extensions/feature-flags';
import { ReduxReducer } from '../extensions/redux';
import { ContextProvider } from '../extensions/context-providers';
import { StandaloneRoutePage } from '../extensions/pages';
import { PVCCreateProp, PVCStatus, PVCAlert, PVCDelete } from '../extensions/pvc';
import { YAMLTemplate } from '../extensions/yaml-templates';
import { AddAction } from '../extensions/add-actions';
import { ClusterGlobalConfig } from '../extensions/cluster-settings';
import {
  HrefNavItem,
  ResourceNSNavItem,
  ResourceClusterNavItem,
  Separator,
  NavSection,
} from '../extensions/navigation';
import { CatalogItemType, CatalogItemProvider, CatalogItemFilter } from '../extensions/catalog';
import { FileUpload } from '../extensions/file-upload';
import { ModelMetadata } from '../extensions/resource-metadata';
import { TelemetryListener } from '../extensions/telemetry';

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
  | ClusterGlobalConfig
  | HrefNavItem
  | ResourceNSNavItem
  | ResourceClusterNavItem
  | Separator
  | NavSection
  | CatalogItemType
  | CatalogItemProvider
  | CatalogItemFilter
  | FileUpload
  | ModelMetadata
  | TelemetryListener;

/**
 * Schema of Console plugin's `console-extensions.json` file.
 */
export type ConsoleExtensionsJSON = SupportedExtension[];
