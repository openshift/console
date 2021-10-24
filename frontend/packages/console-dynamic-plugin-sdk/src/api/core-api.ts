export {
  useK8sWatchResource,
  useK8sWatchResources,
} from '@console/internal/components/utils/k8s-watch-hook';

export { useResolvedExtensions } from '@console/dynamic-plugin-sdk/src/api/useResolvedExtensions';

export {
  consoleFetch,
  consoleFetchJSON,
  consoleFetchText,
} from '@console/dynamic-plugin-sdk/src/utils/fetch';

export { default as useActivePerspective } from '@console/dynamic-plugin-sdk/src/perspective/useActivePerspective';

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
export { HorizontalNavFacade as HorizontalNav } from '@console/internal/components/utils/horizontal-nav';

export { default as VirtualizedTable } from '@console/internal/components/factory/Table/VirtualizedTable';

export { TableData } from '@console/internal/components/factory/Table/VirtualizedTable';

export { useActiveColumns } from '@console/internal/components/factory/Table/active-columns-hook';

export { default as ListPageHeader } from '@console/internal/components/factory/ListPage/ListPageHeader';

export { default as ListPageCreate } from '@console/internal/components/factory/ListPage/ListPageCreate';

export { ListPageCreateLink } from '@console/internal/components/factory/ListPage/ListPageCreate';

export { ListPageCreateButton } from '@console/internal/components/factory/ListPage/ListPageCreate';

export { ListPageCreateDropdown } from '@console/internal/components/factory/ListPage/ListPageCreate';

export { default as ListPageBody } from '@console/internal/components/factory/ListPage/ListPageBody';

export { default as ListPageFilter } from '@console/internal/components/factory/ListPage/ListPageFilter';

export { useListPageFilter } from '@console/internal/components/factory/ListPage/filter-hook';

export { ResourceLink } from '@console/internal/components/utils/resource-link';

export { useK8sModel } from '@console/shared/src/hooks/useK8sModel';

export { useK8sModels } from '@console/shared/src/hooks/useK8sModels';
