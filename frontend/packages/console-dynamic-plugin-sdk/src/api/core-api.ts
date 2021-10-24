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

import { safeRequire } from '../utils/require';

export const useK8sWatchResource: UseK8sWatchResource = safeRequire('@console/internal/components/utils/k8s-watch-hook')
  .useK8sWatchResource;
export const useK8sWatchResources: UseK8sWatchResources = safeRequire('@console/internal/components/utils/k8s-watch-hook')
  .useK8sWatchResources;
export const useResolvedExtensions: UseResolvedExtensions = safeRequire('@console/dynamic-plugin-sdk/src/api/useResolvedExtensions')
  .useResolvedExtensions;
export const consoleFetch: ConsoleFetch = safeRequire('@console/dynamic-plugin-sdk/src/utils/fetch')
  .consoleFetch;
export const consoleFetchJSON: ConsoleFetchJSON = safeRequire('@console/dynamic-plugin-sdk/src/utils/fetch')
  .consoleFetchJSON;
export const consoleFetchText: ConsoleFetchText = safeRequire('@console/dynamic-plugin-sdk/src/utils/fetch')
  .consoleFetchText;

export const useActivePerspective: UseActivePerspective = safeRequire('@console/dynamic-plugin-sdk/src/perspective/useActivePerspective')
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
export const HorizontalNav: React.FC<HorizontalNavProps> = safeRequire('@console/internal/components/utils/horizontal-nav')
  .HorizontalNavFacade;
export const VirtualizedTable: VirtualizedTableFC = safeRequire('@console/internal/components/factory/Table/VirtualizedTable')
  .default;
export const TableData: React.FC<TableDataProps> = safeRequire('@console/internal/components/factory/Table/VirtualizedTable')
  .TableData;
export const useActiveColumns: UseActiveColumns = safeRequire('@console/internal/components/factory/Table/active-columns-hook')
  .useActiveColumns;
export const ListPageHeader: React.FC<ListPageHeaderProps> = safeRequire('@console/internal/components/factory/ListPage/ListPageHeader')
  .default;
export const ListPageCreate: React.FC<ListPageCreateProps> = safeRequire('@console/internal/components/factory/ListPage/ListPageCreate')
  .default;
export const ListPageCreateLink: React.FC<ListPageCreateLinkProps> = safeRequire('@console/internal/components/factory/ListPage/ListPageCreate')
  .ListPageCreateLink;
export const ListPageCreateButton: React.FC<ListPageCreateButtonProps> = safeRequire('@console/internal/components/factory/ListPage/ListPageCreate')
  .ListPageCreateButton;
export const ListPageCreateDropdown: React.FC<ListPageCreateDropdownProps> = safeRequire('@console/internal/components/factory/ListPage/ListPageCreate')
  .ListPageCreateDropdown;
export const ListPageBody: React.FC = safeRequire('@console/internal/components/factory/ListPage/ListPageBody')
  .default;
export const ListPageFilter: React.FC<ListPageFilterProps> = safeRequire('@console/internal/components/factory/ListPage/ListPageFilter')
  .default;
export const useListPageFilter: UseListPageFilter = safeRequire('@console/internal/components/factory/ListPage/filter-hook')
  .useListPageFilter;
export const ResourceLink: React.FC<ResourceLinkProps> = safeRequire('@console/internal/components/utils/resource-link')
  .ResourceLink;
export const useK8sModel: UseK8sModel = safeRequire('@console/shared/src/hooks/useK8sModel')
  .useK8sModel;
export const useK8sModels: UseK8sModels = safeRequire('@console/shared/src/hooks/useK8sModels')
  .useK8sModels;
