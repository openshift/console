/* eslint-disable */
import * as React from 'react';
import {
  UseK8sWatchResource,
  UseK8sWatchResources,
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
  UseActivePerspective,
} from '../extensions/console-types';

export const useK8sWatchResource: UseK8sWatchResource = require('@console/internal/components/utils/k8s-watch-hook')
  .useK8sWatchResource;
export const useK8sWatchResources: UseK8sWatchResources = require('@console/internal/components/utils/k8s-watch-hook')
  .useK8sWatchResources;
export const useResolvedExtensions: UseResolvedExtensions = require('@console/dynamic-plugin-sdk/src/api/useResolvedExtensions')
  .useResolvedExtensions;

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

export { useK8sModel } from '@console/dynamic-plugin-sdk/src/utils/k8s/hooks/useK8sModel';
export { useK8sModels } from '@console/dynamic-plugin-sdk/src/utils/k8s/hooks/useK8sModels';

export {
  consoleFetch,
  consoleFetchJSON,
  consoleFetchText,
} from '@console/dynamic-plugin-sdk/src/utils/fetch';

// Expose K8s CRUD utilities as below
export {
  k8sGetResource as k8sGet,
  k8sCreateResource as k8sCreate,
  k8sUpdateResource as k8sUpdate,
  k8sPatchResource as k8sPatch,
  k8sDeleteResource as k8sDelete,
  k8sListResource as k8sList,
} from '@console/dynamic-plugin-sdk/src/utils/k8s';
export {
  getAPIVersionForModel,
  getGroupVersionKindForResource,
  getGroupVersionKindForModel,
} from '@console/dynamic-plugin-sdk/src/utils/k8s/k8s-ref';
