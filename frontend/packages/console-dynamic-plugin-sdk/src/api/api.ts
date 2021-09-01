/* eslint-disable */
import {
  UseK8sWatchResource,
  UseK8sWatchResources,
  ConsoleFetch,
  ConsoleFetchJSON,
  ConsoleFetchText,
  HorizontalNavProps,
  UseResolvedExtensions,
} from '../extensions/console-types';
import {
  K8sGet,
  K8sCreate,
  K8sUpdate,
  K8sPatch,
  K8sPatchByName,
  K8sKill,
  K8sKillByName,
  K8sList,
  K8sListPartialMetadata,
  K8sWatch,
  K8sWaitForUpdate,
  GetGroupVersionKind,
  IsGroupVersionKind,
  GroupVersionFor,
  ApiVersionCompare,
  GetLatestVersionForCRD,
  ReferenceForCRD,
  ReferenceForOwnerRef,
  ReferenceForExtensionModel,
  ReferenceFor,
  KindForReference,
  ApiGroupForReference,
  VersionForReference,
  ApiVersionForReference,
  NameForModel,
  ReferenceForGroupVersionKind,
  ReferenceForModel,
  ApiVersionForModel,
} from './k8s-types';

export const useK8sWatchResource: UseK8sWatchResource = require('@console/internal/components/utils/k8s-watch-hook')
  .useK8sWatchResource;
export const useK8sWatchResources: UseK8sWatchResources = require('@console/internal/components/utils/k8s-watch-hook')
  .useK8sWatchResources;
export const useResolvedExtensions: UseResolvedExtensions = require('@console/dynamic-plugin-sdk/src/api/useResolvedExtensions')
  .useResolvedExtensions;
export const consoleFetch: ConsoleFetch = require('@console/dynamic-plugin-sdk/src/utils/fetch')
  .consoleFetch;
export const consoleFetchJSON: ConsoleFetchJSON = require('@console/dynamic-plugin-sdk/src/utils/fetch')
  .consoleFetchJSON;
export const consoleFetchText: ConsoleFetchText = require('@console/dynamic-plugin-sdk/src/utils/fetch')
  .consoleFetchText;
/**
 * A component that creates a Navigation bar. It takes array of NavPage objects and renderes a NavBar.
 * Routing is handled as part of the component.
 * @example
 * const HomePage: React.FC = (props) => {
 *     const page = {
 *       href: '/home',
 *       name: 'Home',
 *       component: () => <>Home</>
 *     }
 *     return <HorizontalNav match={props.match} pages={[page]} />
 * }
 *
 * @param {object=} resource - The resource associated with this Navigation, an object of K8sResourceCommon type
 * @param {NavPage[]} pages - An array of page objects
 * @param {object} match - match object provided by React Router
 */
export const HorizontalNav: React.FC<HorizontalNavProps> = require('@console/internal/components/utils/horizontal-nav')
  .HorizontalNavFacade;

// Expose K8s CRUD utilities
export const k8sGet: K8sGet = require('@console/internal/module/k8s/resource').k8sGet;
export const k8sCreate: K8sCreate = require('@console/internal/module/k8s/resource').k8sCreate;
export const k8sUpdate: K8sUpdate = require('@console/internal/module/k8s/resource').k8sUpdate;
export const k8sPatch: K8sPatch = require('@console/internal/module/k8s/resource').k8sPatch;
export const k8sPatchByName: K8sPatchByName = require('@console/internal/module/k8s/resource')
  .k8sPatchByName;
export const k8sKill: K8sKill = require('@console/internal/module/k8s/resource').k8sKill;
export const k8sKillByName: K8sKillByName = require('@console/internal/module/k8s/resource')
  .k8sKill;
export const k8sList: K8sList = require('@console/internal/module/k8s/resource').k8sList;
export const k8sListPartialMetadata: K8sListPartialMetadata = require('@console/internal/module/k8s/resource')
  .k8sListPartialMetadata;
export const k8sWatch: K8sWatch = require('@console/internal/module/k8s/resource').k8sWatch;
export const k8sWaitForUpdate: K8sWaitForUpdate = require('@console/internal/module/k8s/resource')
  .k8sWaitForUpdate;

// Expose K8s reference utilities
export const getGroupVersionKind: GetGroupVersionKind = require('@console/internal/module/k8s/k8s')
  .getGroupVersionKind;
export const isGroupVersionKind: IsGroupVersionKind = require('@console/internal/module/k8s/k8s')
  .isGroupVersionKind;
export const groupVersionFor: GroupVersionFor = require('@console/internal/module/k8s/k8s')
  .groupVersionFor;
export const apiVersionCompare: ApiVersionCompare = require('@console/internal/module/k8s/k8s')
  .apiVersionCompare;
export const getLatestVersionForCRD: GetLatestVersionForCRD = require('@console/internal/module/k8s/k8s')
  .getLatestVersionForCRD;
export const referenceForCRD: ReferenceForCRD = require('@console/internal/module/k8s/k8s')
  .referenceForCRD;
export const referenceForOwnerRef: ReferenceForOwnerRef = require('@console/internal/module/k8s/k8s')
  .referenceForOwnerRef;
export const referenceForExtensionModel: ReferenceForExtensionModel = require('@console/internal/module/k8s/k8s')
  .referenceForExtensionModel;
export const referenceFor: ReferenceFor = require('@console/internal/module/k8s/k8s').referenceFor;
export const kindForReference: KindForReference = require('@console/internal/module/k8s/k8s')
  .kindForReference;
export const apiGroupForReference: ApiGroupForReference = require('@console/internal/module/k8s/k8s')
  .apiGroupForReference;
export const versionForReference: VersionForReference = require('@console/internal/module/k8s/k8s')
  .versionForReference;
export const apiVersionForReference: ApiVersionForReference = require('@console/internal/module/k8s/k8s')
  .apiVersionForReference;
export const nameForModel: NameForModel = require('@console/internal/module/k8s/k8s').nameForModel;
export const referenceForGroupVersionKind: ReferenceForGroupVersionKind = require('@console/internal/module/k8s/k8s-ref')
  .referenceForGroupVersionKind;
export const referenceForModel: ReferenceForModel = require('@console/internal/module/k8s/k8s-ref')
  .referenceForModel;
export const apiVersionForModel: ApiVersionForModel = require('@console/internal/module/k8s/k8s-ref')
  .apiVersionForModel;
