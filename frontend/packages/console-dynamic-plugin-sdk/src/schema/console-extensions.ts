import { FeatureFlag, ModelFeatureFlag } from '../extensions/feature-flags';
import { ReduxReducer } from '../extensions/redux';
import { ContextProvider } from '../extensions/context-providers';
import { StandaloneRoutePage } from '../extensions/pages';
import { PVCCreateProp, PVCStatus, PVCAlert, PVCDelete } from '../extensions/pvc';
import { YAMLTemplate } from '../extensions/yaml-templates';
import { AddAction } from '../extensions/add-actions';
import { ClusterGlobalConfig } from '../extensions/cluster-settings';
import {
  ResourceClusterNavItem,
  HrefNavItem,
  ResourceNSNavItem,
  Separator,
} from '../extensions/navigation';
import { CatalogItemFilter, CatalogItemProvider, CatalogItemType } from '../extensions/catalog';
import { FileUpload } from '../extensions/file-upload';

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
  | Separator
  | HrefNavItem
  | ResourceNSNavItem
  | ResourceClusterNavItem
  | CatalogItemType
  | CatalogItemProvider
  | CatalogItemFilter
  | FileUpload;

/**
 * Schema of Console plugin's `console-extensions.json` file.
 */
export type ConsoleExtensionsJSON = SupportedExtension[];
