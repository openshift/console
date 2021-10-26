/* eslint-disable */
import * as React from 'react';
import {
  UseK8sWatchResource,
  UseK8sWatchResources,
  ConsoleFetch,
  ConsoleFetchJSON,
  ConsoleFetchText,
  HorizontalNavProps,
  UseResolvedExtensions,
  VirtualizedTableFC,
  TableDataProps,
  UseActiveColumns,
  ListPageHeaderProps,
  ListPageCreateProps,
  ListPageCreateLinkProps,
  ListPageCreateButtonProps,
  ListPageCreateDropdownProps,
  ListPageFilterProps,
  UseListPageFilter,
  ResourceLinkProps,
  UseK8sModel,
  UseK8sModels,
  UseActivePerspective,
} from '../extensions/console-types';
import { K8sGet, K8sCreate, K8sUpdate, K8sPatch, K8sDelete, K8sList } from './k8s-types';

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

export const useActivePerspective: UseActivePerspective = require('@console/dynamic-plugin-sdk/src/perspective/useActivePerspective')
  .default;

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
export const VirtualizedTable: VirtualizedTableFC = require('@console/internal/components/factory/Table/VirtualizedTable')
  .default;
export const TableData: React.FC<TableDataProps> = require('@console/internal/components/factory/Table/VirtualizedTable')
  .TableData;
export const useActiveColumns: UseActiveColumns = require('@console/internal/components/factory/Table/active-columns-hook')
  .useActiveColumns;
export const ListPageHeader: React.FC<ListPageHeaderProps> = require('@console/internal/components/factory/ListPage/ListPageHeader')
  .default;
export const ListPageCreate: React.FC<ListPageCreateProps> = require('@console/internal/components/factory/ListPage/ListPageCreate')
  .default;
export const ListPageCreateLink: React.FC<ListPageCreateLinkProps> = require('@console/internal/components/factory/ListPage/ListPageCreate')
  .ListPageCreateLink;
export const ListPageCreateButton: React.FC<ListPageCreateButtonProps> = require('@console/internal/components/factory/ListPage/ListPageCreate')
  .ListPageCreateButton;
export const ListPageCreateDropdown: React.FC<ListPageCreateDropdownProps> = require('@console/internal/components/factory/ListPage/ListPageCreate')
  .ListPageCreateDropdown;
export const ListPageBody: React.FC = require('@console/internal/components/factory/ListPage/ListPageBody')
  .default;
export const ListPageFilter: React.FC<ListPageFilterProps> = require('@console/internal/components/factory/ListPage/ListPageFilter')
  .default;
export const useListPageFilter: UseListPageFilter = require('@console/internal/components/factory/ListPage/filter-hook')
  .useListPageFilter;
export const ResourceLink: React.FC<ResourceLinkProps> = require('@console/internal/components/utils/resource-link')
  .ResourceLink;
export const useK8sModel: UseK8sModel = require('@console/shared/src/hooks/useK8sModel')
  .useK8sModel;
export const useK8sModels: UseK8sModels = require('@console/shared/src/hooks/useK8sModels')
  .useK8sModels;

// Expose K8s CRUD utilities as below
export const k8sGet: K8sGet = require('@console/dynamic-plugin-sdk/src/utils/k8s').k8sGetResource;
export const k8sCreate: K8sCreate = require('@console/dynamic-plugin-sdk/src/utils/k8s')
  .k8sCreateResource;
export const k8sUpdate: K8sUpdate = require('@console/dynamic-plugin-sdk/src/utils/k8s')
  .k8sUpdateResource;
export const k8sPatch: K8sPatch = require('@console/dynamic-plugin-sdk/src/utils/k8s')
  .k8sPatchResource;
export const k8sDelete: K8sDelete = require('@console/dynamic-plugin-sdk/src/utils/k8s')
  .k8sDeleteResource;
export const k8sList: K8sList = require('@console/dynamic-plugin-sdk/src/utils/k8s')
  .k8sListResource;
