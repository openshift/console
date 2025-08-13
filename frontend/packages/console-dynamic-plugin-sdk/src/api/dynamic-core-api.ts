/* eslint-disable */
import * as React from 'react';
import { ActionServiceProviderProps } from '../extensions/actions';
import {
  CodeEditorProps,
  CodeEditorRef,
  DocumentTitleProps,
  ErrorBoundaryFallbackProps,
  HorizontalNavProps,
  InventoryItemBodyProps,
  InventoryItemStatusProps,
  InventoryItemTitleProps,
  ListPageCreateButtonProps,
  ListPageCreateDropdownProps,
  ListPageCreateLinkProps,
  ListPageCreateProps,
  ListPageFilterProps,
  ListPageHeaderProps,
  NamespaceBarProps,
  OverviewGridProps,
  OverviewProps,
  QueryBrowserProps,
  ResourceEventStreamProps,
  ResourceIconProps,
  ResourceLinkProps,
  ResourceYAMLEditorProps,
  TableDataProps,
  TimestampProps,
  UseActiveColumns,
  UseActiveNamespace,
  UseAnnotationsModal,
  UseDeleteModal,
  UseLabelsModal,
  UseListPageFilter,
  UsePrometheusPoll,
  UseQuickStartContext,
  UseResolvedExtensions,
  UseUserSettings,
  VirtualizedTableFC,
} from '../extensions/console-types';
import { StatusPopupSectionProps, StatusPopupItemProps } from '../extensions/dashboard-types';

export * from '../app/components';
export * from './common-types';
export * from './utils';

/**
 * React hook for consuming Console extensions with resolved `CodeRef` properties.
 *
 * This hook is essential for plugin development as it resolves dynamic imports (CodeRefs) that point to
 * remote module components. It's commonly used when building extension points that need to load components
 * from different plugins.
 *
 * **Common use cases:**
 * - Building navigation extensions that load components from multiple plugins
 * - Creating action extensions that reference components in other modules
 * - Implementing dashboard cards that come from various plugins
 *
 * **Performance considerations:**
 * - The hook uses async resolution, so components should handle loading states
 * - Results are memoized and referentially stable across re-renders
 * - Failed resolutions are logged to console and returned in the errors array
 *
 * **Edge cases:**
 * - Returns empty array initially until resolution completes
 * - If CodeRef resolution fails, those extensions are excluded from results
 * - When extension list changes, previous results are returned until new resolution completes
 *
 * @example
 * ```tsx
 * // Basic usage for nav item extensions
 * const [navItemExtensions, navItemsResolved, errors] = useResolvedExtensions<NavItem>(isNavItem);
 *
 * if (!navItemsResolved) {
 *   return <LoadingSpinner />;
 * }
 *
 * if (errors.length > 0) {
 *   console.warn('Some extensions failed to load:', errors);
 * }
 *
 * return (
 *   <nav>
 *     {navItemExtensions.map(ext => (
 *       <ext.properties.component key={ext.uid} />
 *     ))}
 *   </nav>
 * );
 * ```
 *
 * @example
 * ```tsx
 * // Multiple type guards for different extension types
 * const [actionExtensions] = useResolvedExtensions(
 *   isResourceAction,
 *   isGroupAction,
 *   isResourceActionProvider
 * );
 * ```
 *
 * @param typeGuards A list of type guard functions that filter extensions. Each function receives an extension and returns boolean indicating type match. Common guards: `isNavItem`, `isResourceAction`, `isDashboardCard`
 * @returns Tuple containing:
 *   - `extensions`: Array of resolved extension instances with CodeRefs converted to actual components
 *   - `resolved`: Boolean indicating if async resolution is complete (false during initial load)
 *   - `errors`: Array of errors from failed CodeRef resolutions (useful for debugging)
 */
export const useResolvedExtensions: UseResolvedExtensions = require('@console/dynamic-plugin-sdk/src/api/useResolvedExtensions')
  .useResolvedExtensions;

/**
 * A component that creates a Navigation bar for a page with automatic routing and extension support.
 *
 * This component provides a standard tabbed navigation pattern used throughout the OpenShift Console.
 * It automatically handles routing between tabs and integrates with the plugin extension system.
 *
 * **Common use cases:**
 * - Resource detail pages (Pod details, Deployment details, etc.)
 * - Multi-step workflows with distinct pages
 * - Plugin pages that need consistent navigation patterns
 *
 * **Extension integration:**
 * - Other plugins can contribute tabs via `console.tab/horizontalNav` extensions
 * - Extensions are automatically resolved and integrated into the navigation
 * - Custom data is passed to all tab components for context sharing
 *
 * **Routing behavior:**
 * - URL fragments automatically sync with active tab
 * - Navigation preserves query parameters and namespace context
 * - Supports nested routing within individual tabs
 *
 * **Edge cases:**
 * - If no pages are provided, renders empty navigation
 * - Invalid hrefs in pages array may cause routing issues
 * - Resource prop should match the type expected by tab components
 *
 * @example
 * ```tsx
 * // Basic resource detail navigation
 * const PodDetailsPage: React.FC<{pod: PodKind}> = ({pod}) => {
 *   const pages = [
 *     {
 *       href: '',
 *       name: 'Details',
 *       component: PodDetails
 *     },
 *     {
 *       href: 'yaml',
 *       name: 'YAML',
 *       component: PodYAML
 *     },
 *     {
 *       href: 'logs',
 *       name: 'Logs',
 *       component: PodLogs
 *     }
 *   ];
 *
 *   return (
 *     <HorizontalNav
 *       resource={pod}
 *       pages={pages}
 *       customData={{theme: 'dark', showAdvanced: true}}
 *     />
 *   );
 * };
 * ```
 *
 * @example
 * ```tsx
 * // Navigation with conditional tabs
 * const ConditionalNav: React.FC = () => {
 *   const canViewLogs = useAccessReview({...});
 *   const pages = [
 *     {href: '', name: 'Overview', component: Overview},
 *     ...(canViewLogs ? [{href: 'logs', name: 'Logs', component: Logs}] : [])
 *   ];
 *   return <HorizontalNav pages={pages} />;
 * };
 * ```
 *
 * @param resource Optional K8sResourceCommon object representing the resource being viewed. Passed to all tab components as props. Should match the expected type for the page components.
 * @param pages Array of page configuration objects. Each page must have `href` (URL fragment), `name` (display text), and `component` (React component to render)
 * @param customData Optional object containing custom data passed to all tab components. Useful for sharing configuration, theme settings, or computed values between tabs
 */
export const HorizontalNav: React.FC<HorizontalNavProps> = require('@console/internal/components/utils/horizontal-nav')
  .HorizontalNavFacade;

/**
 * @deprecated Use PatternFly's [Data view](https://www.patternfly.org/extensions/data-view/overview) instead.
 * A component for making virtualized tables
 * @param {D} data - data for table
 * @param {boolean} loaded - flag indicating data is loaded
 * @param {*} loadError - error object if issue loading data
 * @param {TableColumn[]} columns - column setup
 * @param {React.ComponentType} Row - row setup
 * @param {D} unfilteredData - original data without filter
 * @param {React.ComponentType} [NoDataEmptyMsg] - (optional) no data empty message component
 * @param {React.ComponentType} [EmptyMsg] - (optional) empty message component
 * @param {function} [scrollNode] - (optional) function to handle scroll
 * @param {string} [label] - (optional) label for table
 * @param {string} [ariaLabel] - (optional) aria label
 * @param {TableGridBreakpoint} [gridBreakPoint] - sizing of how to break up grid for responsiveness
 * @param {function} [onSelect] - (optional) function for handling select of table
 * @param {R} [rowData] - (optional) data specific to row
 * @param {number} [sortColumnIndex] - (optional) The index of the column to sort. The default is `0`
 * @param {SortByDirection.asc | SortByDirection.desc} [sortDirection] - (optional) The direction of the sort. The default is `SortByDirection.asc`
 * @param {function} [onRowsRendered] - (optional) Callback invoked with information about the slice of rows that were just rendered.
 * @example
 * ```ts
 * const MachineList: React.FC<MachineListProps> = (props) => {
 *   return (
 *     <VirtualizedTable<MachineKind>
 *      {...props}
 *      aria-label='Machines'
 *      columns={getMachineColumns}
 *      Row={getMachineTableRow}
 *     />
 *   );
 * }
 * ```
 */
export const VirtualizedTable: VirtualizedTableFC = require('@console/internal/components/factory/Table/VirtualizedTable')
  .default;

/**
 * Component for displaying table data within a table row
 * @param {string} id - unique id for table
 * @param {Set<string>} activeColumnIDs - active columns
 * @param {string} [className] -  (optional) option class name for styling
 * @example
 * ```ts
 * const PodRow: React.FC<RowProps<K8sResourceCommon>> = ({ obj, activeColumnIDs }) => {
 *   return (
 *     <>
 *       <TableData id={columns[0].id} activeColumnIDs={activeColumnIDs}>
 *         <ResourceLink kind="Pod" name={obj.metadata.name} namespace={obj.metadata.namespace} />
 *       </TableData>
 *       <TableData id={columns[1].id} activeColumnIDs={activeColumnIDs}>
 *         <ResourceLink kind="Namespace" name={obj.metadata.namespace} />
 *       </TableData>
 *       // Important:  the kebab menu cell should include the id and className prop values below
 *       <TableData id='' className='pf-v6-c-table__action' activeColumnIDs={activeColumnIDs}>
 *         <MockKebabMenu obj={obj} />
 *      </TableData>
 *     </>
 *   );
 * };
 * ```
 */
export const TableData: React.FC<TableDataProps> = require('@console/internal/components/factory/Table/VirtualizedTable')
  .TableData;

/**
 * A hook that provides a list of user-selected active TableColumns with persistent column management.
 *
 * This hook integrates with the Console's column management system, allowing users to show/hide
 * table columns with their preferences saved across sessions.
 *
 * **Common use cases:**
 * - Resource list tables that need customizable column visibility
 * - Complex tables with many optional columns
 * - Tables that need namespace column conditional visibility
 *
 * **Persistence behavior:**
 * - Column selections are saved to user settings (ConfigMap or localStorage)
 * - Settings persist across browser sessions and page reloads
 * - Each table can have independent column management via columnManagementID
 *
 * **Column management integration:**
 * - Works with the standard "Manage Columns" modal in table headers
 * - Supports default column visibility via the `additional` property
 * - Automatically handles system columns that can't be hidden
 *
 * **Namespace column logic:**
 * - Automatically hides namespace column when viewing single namespace
 * - Shows namespace column when viewing "All Namespaces"
 * - `showNamespaceOverride` can force namespace column visibility
 *
 * **Edge cases:**
 * - Returns all non-additional columns if no user settings exist
 * - Filters out invalid column IDs from saved settings
 * - Handles missing columnManagementID gracefully
 * - Always includes columns with empty title (system columns)
 *
 * @example
 * ```tsx
 * // Basic table with column management
 * const ResourceTable: React.FC<{data: K8sResourceKind[]}> = ({data}) => {
 *   const columns: TableColumn<K8sResourceKind>[] = [
 *     {id: 'name', title: 'Name', sort: 'metadata.name'},
 *     {id: 'namespace', title: 'Namespace', sort: 'metadata.namespace'},
 *     {id: 'status', title: 'Status', additional: true}, // hidden by default
 *     {id: 'created', title: 'Created', sort: 'metadata.creationTimestamp'},
 *     {id: '', title: '', props: {className: 'dropdown-kebab-pf'}} // always visible
 *   ];
 *
 *   const [activeColumns, userSettingsLoaded] = useActiveColumns({
 *     columns,
 *     columnManagementID: 'core~v1~Pod', // unique ID for this table
 *     showNamespaceOverride: false
 *   });
 *
 *   if (!userSettingsLoaded) {
 *     return <TableSkeleton columns={columns} />;
 *   }
 *
 *   return <VirtualizedTable columns={activeColumns} data={data} />;
 * };
 * ```
 *
 * @example
 * ```tsx
 * // Table with forced namespace column
 * const ClusterScopedTable: React.FC = () => {
 *   const [activeColumns] = useActiveColumns({
 *     columns: allColumns,
 *     columnManagementID: 'extensions~v1~CustomResource',
 *     showNamespaceOverride: true // always show namespace column
 *   });
 *
 *   return <VirtualizedTable columns={activeColumns} {...props} />;
 * };
 * ```
 *
 * @example
 * ```tsx
 * // Table without column management (simple mode)
 * const SimpleTable: React.FC = () => {
 *   const [activeColumns] = useActiveColumns({
 *     columns: basicColumns
 *     // no columnManagementID = no persistence
 *   });
 *
 *   return <Table columns={activeColumns} {...props} />;
 * };
 * ```
 *
 * @param options Configuration object for column management
 * @param options.columns Array of all available TableColumn objects that define the table structure
 * @param options.showNamespaceOverride Optional boolean to force namespace column visibility regardless of current namespace context
 * @param options.columnManagementID Optional unique identifier for persisting column preferences. Should be in format "group~version~kind" for resources
 * @returns Tuple containing:
 *   - `activeColumns`: Filtered array of columns that should be displayed based on user preferences
 *   - `userSettingsLoaded`: Boolean indicating if user settings have been loaded from storage
 */
export const useActiveColumns: UseActiveColumns = require('@console/internal/components/factory/Table/active-columns-hook')
  .useActiveColumns;

/**
 * Component for generating a page header
 * @param {string} title - The heading title. If no title is set, only the `children`, `badge`, and `helpAlert` props will be rendered.
 * @param {ReactNode} [badge] -  (optional) A badge that is displayed next to the title of the heading
 * @param {ReactNode} [helpAlert] -  (optional) An alert placed below the heading in the same PageSection.
 * @param {ReactNode} [helpText] -  (optional) A subtitle placed below the title.
 * @param {boolean} [hideFavoriteButton] - (optional) The "Add to favourites" button is shown by default while in the admin perspective. This prop allows you to hide the button. It should be hidden when `ListPageHeader` is not the primary page header to avoid having multiple favourites buttons.
 * @param {ReactNode} [children] -  (optional) A primary action that is always rendered.
 * @example
 * ```ts
 * const exampleList: React.FC = () => {
 *   return (
 *     <>
 *       <ListPageHeader title="Example List Page"/>
 *     </>
 *   );
 * };
 * ```
 */
export const ListPageHeader: React.FC<ListPageHeaderProps> = require('@console/internal/components/factory/ListPage/ListPageHeader')
  .default;

/**
 * Component for adding a create button for a specific resource kind that automatically generates a link to the create YAML for this resource.
 * @param groupVersionKind group, version, kind of k8s resource `K8sGroupVersionKind` is preferred alternatively can pass reference for group, version, kind which is deprecated i.e `group~version~kind` `K8sResourceKindReference`. Core resources with no API group should leave off the `group` property
 * @example
 * ```ts
 * const exampleList: React.FC<MyProps> = () => {
 *   return (
 *     <>
 *       <ListPageHeader title="Example List Page"/>
 *         <ListPageCreate groupVersionKind={{ group: 'app'; version: 'v1'; kind: 'Deployment' }}>Create Deployment</ListPageCreate>
 *       </ListPageHeader>
 *     </>
 *   );
 * };
 * ```
 */
export const ListPageCreate: React.FC<ListPageCreateProps> = require('@console/internal/components/factory/ListPage/ListPageCreate')
  .default;

/**
 * Component for creating a stylized link with built-in access control validation.
 *
 * This component provides a consistent way to create navigation links that automatically
 * check user permissions before rendering, ensuring users only see links they can actually use.
 *
 * **Common use cases:**
 * - Create buttons that navigate to resource creation forms
 * - Action links in list page headers
 * - Navigation links that require specific permissions
 *
 * **Access control:**
 * - Automatically validates user permissions using provided access review
 * - Hides or disables link if user lacks required permissions
 * - Supports both resource-level and namespace-level access checks
 *
 * **Styling:**
 * - Applies consistent Console link styling
 * - Integrates with PatternFly button and link components
 * - Supports various visual states (normal, disabled, loading)
 *
 * **Edge cases:**
 * - If no access review provided, link is always visible
 * - Invalid 'to' prop may cause navigation issues
 * - Access review failures result in hidden/disabled link
 *
 * @example
 * ```tsx
 * // Basic create link with access control
 * const CreatePodLink: React.FC<{namespace: string}> = ({namespace}) => {
 *   return (
 *     <ListPageCreateLink
 *       to={`/k8s/ns/${namespace}/pods/~new`}
 *       createAccessReview={{
 *         group: '',
 *         resource: 'pods',
 *         verb: 'create',
 *         namespace
 *       }}
 *     >
 *       Create Pod
 *     </ListPageCreateLink>
 *   );
 * };
 * ```
 *
 * @example
 * ```tsx
 * // Conditional link based on cluster permissions
 * const CreateClusterRoleLink: React.FC = () => {
 *   return (
 *     <ListPageCreateLink
 *       to="/k8s/cluster/clusterroles/~new"
 *       createAccessReview={{
 *         group: 'rbac.authorization.k8s.io',
 *         resource: 'clusterroles',
 *         verb: 'create'
 *         // no namespace for cluster-scoped resources
 *       }}
 *     >
 *       Create ClusterRole
 *     </ListPageCreateLink>
 *   );
 * };
 * ```
 *
 * @param to String URL path where the link should navigate. Can be relative or absolute path
 * @param createAccessReview Optional access review object specifying the permissions required to show this link. Contains group, resource, verb, and optionally namespace
 * @param children Optional React children to render inside the link component
 */
export const ListPageCreateLink: React.FC<ListPageCreateLinkProps> = require('@console/internal/components/factory/ListPage/ListPageCreate')
  .ListPageCreateLink;

/**
 * Component for creating button.
 * @param {object} [createAccessReview] - (optional) object with namespace and kind used to determine access
 * @param {...object} [pfButtonProps] - (optional) Patternfly Button props
 * @example
 * ```ts
 * const exampleList: React.FC<MyProps> = () => {
 *   return (
 *     <>
 *       <ListPageHeader title="Example Pod List Page"/>
 *         <ListPageCreateButton createAccessReview={access}>Create Pod</ListPageCreateButton>
 *       </ListPageHeader>
 *     </>
 *   );
 * };
 * ```
 */
export const ListPageCreateButton: React.FC<ListPageCreateButtonProps> = require('@console/internal/components/factory/ListPage/ListPageCreate')
  .ListPageCreateButton;

/**
 * Component for creating a dropdown wrapped with permissions check.
 * @param {object} items - key:ReactNode pairs of items to display in dropdown component
 * @param {function} onClick - callback function for click on dropdown items
 * @param {object} [createAccessReview] - (optional) object with namespace and kind used to determine access
 * @param {ReactNode} [children] -  (optional) children for the dropdown toggle
 * @example
 * ```ts
 * const exampleList: React.FC<MyProps> = () => {
 *   const items = {
 *     SAVE: 'Save',
 *     DELETE: 'Delete',
 *   }
 *   return (
 *     <>
 *      <ListPageHeader title="Example Pod List Page"/>
 *        <ListPageCreateDropdown createAccessReview={access} items={items}>Actions</ListPageCreateDropdown>
 *      </ListPageHeader>
 *     </>
 *   );
 * };
 * ```
 */
export const ListPageCreateDropdown: React.FC<ListPageCreateDropdownProps> = require('@console/internal/components/factory/ListPage/ListPageCreate')
  .ListPageCreateDropdown;

/**
 * @deprecated Use PatternFly's [Data view](https://www.patternfly.org/extensions/data-view/overview) instead.
 * Component that generates filter for list page.
 * @param {D} data - An array of data points
 * @param {boolean} loaded - indicates that data has loaded
 * @param {function} onFilterChange - callback function for when filter is updated
 * @param {RowFilter[]} [rowFilters] - (optional) An array of RowFilter elements that define the available filter options
 * @param {string} [labelFilter] - (optional) a unique name key for label filter. This may be useful if there are multiple `ListPageFilter` components rendered at once.
 * @param {string} [labelPath] - (optional) the path to labels to filter from
 * @param {string} [nameFilterTitle] - (optional) title for name filter
 * @param {string} [nameFilterPlaceholder] -  (optional) placeholder for name filter
 * @param {string} [labelFilterPlaceholder] -  (optional) placeholder for label filter
 * @param {boolean} [hideLabelFilter] -  (optional) only shows the name filter instead of both name and label filter
 * @param {boolean} [hideNameLabelFilter] -  (optional) hides both name and label filter
 * @param {ColumnLayout} [columnLayout] -  (optional) column layout object
 * @param {boolean} [hideColumnManagement] -  (optional) flag to hide the column management
 * @param {string} [nameFilter] - (optional) a unique name key for name filter. This may be useful if there are multiple `ListPageFilter` components rendered at once.
 * @param {RowSearchFilter[]} [rowSearchFilters] - (optional) An array of RowSearchFilters elements that define search text filters added on top of Name and Label filters
 * @example
 * ```tsx
 *   // See implementation for more details on RowFilter and FilterValue types
 *   const [staticData, filteredData, onFilterChange] = useListPageFilter(
 *     data,
 *     [...rowFilters, ...searchFilters],
 *     staticFilters,
 *   );
 *   // ListPageFilter updates filter state based on user interaction and resulting filtered data can be rendered in an independent component.
 *   return (
 *     <>
 *       <ListPageHeader />
 *       <ListPagBody>
 *         <ListPageFilter data={staticData} onFilterChange={onFilterChange} rowFilters={rowFilters} rowSearchFilters={searchFilters} />
 *         <List data={filteredData} />
 *       </ListPageBody>
 *     </>
 *   )
 * ```
 */
export const ListPageFilter: React.FC<ListPageFilterProps> = require('@console/internal/components/factory/ListPage/ListPageFilter')
  .default;

/**
 * @deprecated Use PatternFly's [Data view](https://www.patternfly.org/extensions/data-view/overview) instead.
 * A hook that manages filter state for the ListPageFilter component.
 * @param data - An array of data points
 * @param rowFilters - (optional) An array of RowFilter elements that define the available filter options
 * @param staticFilters - (optional) An array of FilterValue elements that are statically applied to the data
 * @returns A tuple containing the data filtered by all static filteres, the data filtered by all static and row filters, and a callback that updates rowFilters
 * @example
 * ```tsx
 *   // See implementation for more details on RowFilter and FilterValue types
 *   const [staticData, filteredData, onFilterChange] = useListPageFilter(
 *     data,
 *     rowFilters,
 *     staticFilters,
 *   );
 *   // ListPageFilter updates filter state based on user interaction and resulting filtered data can be rendered in an independent component.
 *   return (
 *     <>
 *       <ListPageHeader .../>
 *       <ListPagBody>
 *         <ListPageFilter data={staticData} onFilterChange={onFilterChange} />
 *         <List data={filteredData} />
 *       </ListPageBody>
 *     </>
 *   )
 * ```
 */
export const useListPageFilter: UseListPageFilter = require('@console/internal/components/factory/ListPage/filter-hook')
  .useListPageFilter;

/**
 * Component that creates a link to a specific resource type with an icon badge.
 *
 * This is one of the most commonly used components in the Console, providing a consistent
 * way to display and link to Kubernetes resources throughout the interface.
 *
 * **Common use cases:**
 * - Displaying resource references in tables and detail views
 * - Creating navigation between related resources
 * - Showing resource relationships and dependencies
 *
 * **Visual appearance:**
 * - Automatically displays appropriate icon for the resource type
 * - Shows resource name as clickable link (when linkTo=true)
 * - Supports custom display names and truncation for long names
 * - Integrates with Console's resource icon system
 *
 * **Navigation behavior:**
 * - Links to standard resource detail pages by default
 * - Respects current namespace context for namespaced resources
 * - Handles both cluster-scoped and namespaced resources
 * - Supports custom click handlers for non-standard navigation
 *
 * **Edge cases:**
 * - Missing resource names display as "(none)" or similar placeholder
 * - Invalid resource kinds may show generic icons
 * - Cluster-scoped resources ignore namespace parameter
 * - Non-existent resources still render links (404 handled by target page)
 *
 * @example
 * ```tsx
 * // Basic resource link
 * const PodReference: React.FC<{pod: PodKind}> = ({pod}) => {
 *   return (
 *     <ResourceLink
 *       kind="Pod"
 *       name={pod.metadata.name}
 *       namespace={pod.metadata.namespace}
 *       title={pod.metadata.uid}
 *     />
 *   );
 * };
 * ```
 *
 * @example
 * ```tsx
 * // Custom resource with groupVersionKind
 * const CustomResourceLink: React.FC<{cr: K8sResourceKind}> = ({cr}) => {
 *   return (
 *     <ResourceLink
 *       groupVersionKind={{
 *         group: 'example.com',
 *         version: 'v1',
 *         kind: 'MyResource'
 *       }}
 *       name={cr.metadata.name}
 *       namespace={cr.metadata.namespace}
 *       displayName={`${cr.metadata.name} (Custom)`}
 *     />
 *   );
 * };
 * ```
 *
 * @example
 * ```tsx
 * // Non-linking resource display
 * const ResourceBadge: React.FC<{resource: K8sResourceKind}> = ({resource}) => {
 *   return (
 *     <ResourceLink
 *       kind={resource.kind}
 *       name={resource.metadata.name}
 *       linkTo={false} // display only, no link
 *       truncate={true}
 *       className="resource-badge"
 *     />
 *   );
 * };
 * ```
 *
 * @example
 * ```tsx
 * // Resource link with custom click handler
 * const SelectableResourceLink: React.FC<{resource: K8sResourceKind, onSelect: (resource) => void}> = ({resource, onSelect}) => {
 *   return (
 *     <ResourceLink
 *       kind={resource.kind}
 *       name={resource.metadata.name}
 *       namespace={resource.metadata.namespace}
 *       linkTo={false}
 *       onClick={() => onSelect(resource)}
 *       className="cursor-pointer"
 *     />
 *   );
 * };
 * ```
 *
 * @param kind Optional legacy resource kind reference string (deprecated, use groupVersionKind instead)
 * @param groupVersionKind Optional object with group, version, and kind properties for the resource type
 * @param className Optional CSS class name to apply to the component
 * @param displayName Optional custom display name that overrides the resource name
 * @param inline Optional boolean to render icon and name inline with children (default: false)
 * @param linkTo Optional boolean to create a navigable link (default: true)
 * @param name Optional name of the resource instance
 * @param namespace Optional namespace for namespaced resources
 * @param hideIcon Optional boolean to hide the resource type icon (default: false)
 * @param title Optional title attribute for the link element (not visually displayed)
 * @param dataTest Optional test identifier for automated testing
 * @param onClick Optional click handler function, overrides default navigation when provided
 * @param truncate Optional boolean to truncate long resource names (default: false)
 */
export const ResourceLink: React.FC<ResourceLinkProps> = require('@console/internal/components/utils/resource-link')
  .ResourceLink;
export { default as ResourceStatus } from '../app/components/utils/resource-status';

/**
 * Component that creates an icon badge for a specific resource type.
 *
 * This component provides visual identification for Kubernetes resource types throughout
 * the Console interface, helping users quickly identify different kinds of resources.
 *
 * **Common use cases:**
 * - Table columns showing resource type icons
 * - Legend components for multi-resource views
 * - Resource type indicators in forms and selectors
 *
 * **Icon system:**
 * - Uses Console's built-in icon mapping for standard Kubernetes resources
 * - Falls back to generic icons for unknown or custom resource types
 * - Supports both legacy kind strings and modern groupVersionKind objects
 * - Icons are SVG-based and scale appropriately
 *
 * **Visual consistency:**
 * - Maintains consistent sizing and spacing
 * - Integrates with PatternFly design system
 * - Supports custom CSS classes for styling overrides
 *
 * **Edge cases:**
 * - Unknown resource kinds display a generic resource icon
 * - Missing kind parameter shows a default placeholder icon
 * - Custom resources may not have specific icons
 *
 * @example
 * ```tsx
 * // Basic resource icon
 * const ResourceTypeIndicator: React.FC<{resourceKind: string}> = ({resourceKind}) => {
 *   return (
 *     <div className="resource-type-indicator">
 *       <ResourceIcon kind={resourceKind} />
 *       <span>{resourceKind}</span>
 *     </div>
 *   );
 * };
 * ```
 *
 * @example
 * ```tsx
 * // Custom resource icon with groupVersionKind
 * const CustomResourceIcon: React.FC = () => {
 *   return (
 *     <ResourceIcon
 *       groupVersionKind={{
 *         group: 'operators.coreos.com',
 *         version: 'v1alpha1',
 *         kind: 'ClusterServiceVersion'
 *       }}
 *       className="operator-icon"
 *     />
 *   );
 * };
 * ```
 *
 * @example
 * ```tsx
 * // Icon grid for resource type legend
 * const ResourceTypeLegend: React.FC<{resourceTypes: string[]}> = ({resourceTypes}) => {
 *   return (
 *     <div className="resource-legend">
 *       {resourceTypes.map(kind => (
 *         <div key={kind} className="legend-item">
 *           <ResourceIcon kind={kind} />
 *           <span>{kind}</span>
 *         </div>
 *       ))}
 *     </div>
 *   );
 * };
 * ```
 *
 * @param kind Optional legacy resource kind reference string (deprecated, use groupVersionKind instead)
 * @param groupVersionKind Optional object with group, version, and kind properties for the resource type
 * @param className Optional CSS class name to apply to the icon component
 */
export const ResourceIcon: React.FC<ResourceIconProps> = require('@console/internal/components/utils/resource-icon')
  .ResourceIcon;

export {
  useK8sModel,
  useK8sModels,
  useK8sWatchResource,
  useK8sWatchResources,
} from '../utils/k8s/hooks';

export { consoleFetch, consoleFetchJSON, consoleFetchText } from '../utils/fetch';

// Expose K8s CRUD utilities as below
export {
  k8sGetResource as k8sGet,
  k8sCreateResource as k8sCreate,
  k8sUpdateResource as k8sUpdate,
  k8sPatchResource as k8sPatch,
  k8sDeleteResource as k8sDelete,
  k8sListResource as k8sList,
  k8sListResourceItems as k8sListItems,
} from '../utils/k8s';
export {
  getAPIVersionForModel,
  getGroupVersionKindForResource,
  getGroupVersionKindForModel,
} from '../utils/k8s/k8s-ref';

/**
 * Component that shows the status in a popup window. Can be used when building `console.dashboards/overview/health/resource` extensions.
 * @param {ReactNode} firstColumn - values for first column of popup
 * @param {ReactNode} [secondColumn] - (optional) values for second column of popup
 * @param {ReactNode} [children] -  (optional) children for the popup
 * @example
 * ```tsx
 *   <StatusPopupSection
 *     firstColumn={
 *       <>
 *         <span>{title}</span>
 *         <span className="pf-v6-u-text-color-subtle">
 *           My Example Item
 *         </span>
 *       </>
 *     }
 *     secondColumn='Status'
 *   >
 * ```
 */
export const StatusPopupSection: React.FC<StatusPopupSectionProps> = require('@console/shared/src/components/dashboard/status-card/StatusPopup')
  .StatusPopupSection;

/**
 * Status element used in status popup. Used in in `StatusPopupSection`.
 * @param {string} [value] - (optional) text value to display
 * @param {string} [icon] - (optional) icon to display
 * @param {React.ReactNode} children - child elements
 * @example
 * ```tsx
 * <StatusPopupSection
 *    firstColumn='Example'
 *    secondColumn='Status'
 * >
 *    <StatusPopupItem icon={healthStateMapping[MCGMetrics.state]?.icon}>
 *       Complete
 *    </StatusPopupItem>
 *    <StatusPopupItem icon={healthStateMapping[RGWMetrics.state]?.icon}>
 *        Pending
 *    </StatusPopupItem>
 * </StatusPopupSection>
 * ```
 */
export const StatusPopupItem: React.FC<StatusPopupItemProps> = require('@console/shared/src/components/dashboard/status-card/StatusPopup')
  .default;

/**
 * Creates a wrapper component for a dashboard.
 * @param {string} [className] - (optional) style class for div
 * @param {React.ReactNode} [children] - (optional) elements of the dashboard
 * @example
 * ```tsx
 *     <Overview>
 *       <OverviewGrid mainCards={mainCards} leftCards={leftCards} rightCards={rightCards} />
 *     </Overview>
 *```
 */
export const Overview: React.FC<OverviewProps> = require('@console/shared/src/components/dashboard/Dashboard')
  .default;

/**
 * Creates a grid of card elements for a dashboard. Used within `Overview`.
 * @param {OverviewGridCard[]} mainCards - cards for grid
 * @param {OverviewGridCard[]} [leftCards] - (optional) cards for left side of grid
 * @param {OverviewGridCard[]} [rightCards] - (optional) cards for right side of grid
 * @example
 * ```tsx
 *     <Overview>
 *       <OverviewGrid mainCards={mainCards} leftCards={leftCards} rightCards={rightCards} />
 *     </Overview>
 *```
 */
export const OverviewGrid: React.FC<OverviewGridProps> = require('@console/shared/src/components/dashboard/DashboardGrid')
  .default;

/**
 * Creates an inventory card item.
 * @param {React.ReactNode} children - elements to render inside the item
 * @example
 * ```tsx
 *   return (
 *     <InventoryItem>
 *       <InventoryItemTitle>{title}</InventoryItemTitle>
 *       <InventoryItemBody error={loadError}>
 *         {loaded && <InventoryItemStatus count={workerNodes.length} icon={<MonitoringIcon />} />}
 *       </InventoryItemBody>
 *     </InventoryItem>
 *   )
 * ```
 */
export const InventoryItem: React.FC = require('@console/shared/src/components/dashboard/inventory-card/InventoryCard')
  .default;

/**
 * Creates a title for an inventory card item. Used within `InventoryItem`.
 * @param {React.ReactNode} children - elements to render inside the title
 * @example
 *  ```tsx
 *   return (
 *     <InventoryItem>
 *       <InventoryItemTitle>{title}</InventoryItemTitle>
 *       <InventoryItemBody error={loadError}>
 *         {loaded && <InventoryItemStatus count={workerNodes.length} icon={<MonitoringIcon />} />}
 *       </InventoryItemBody>
 *     </InventoryItem>
 *   )
 * ```
 */
export const InventoryItemTitle: React.FC<InventoryItemTitleProps> = require('@console/shared/src/components/dashboard/inventory-card/InventoryCard')
  .InventoryItemTitle;

/**
 * Creates the body of an inventory card. Used within `InventoryCard` and can be used with `InventoryTitle`.
 * @param {React.ReactNode} children - elements to render inside the inventory card or title
 * @param {*} error - elements of the div
 * @example
 *  ```tsx
 *   return (
 *     <InventoryItem>
 *       <InventoryItemTitle>{title}</InventoryItemTitle>
 *       <InventoryItemBody error={loadError}>
 *         {loaded && <InventoryItemStatus count={workerNodes.length} icon={<MonitoringIcon />} />}
 *       </InventoryItemBody>
 *     </InventoryItem>
 *   )
 * ```
 */
export const InventoryItemBody: React.FC<InventoryItemBodyProps> = require('@console/shared/src/components/dashboard/inventory-card/InventoryCard')
  .InventoryItemBody;

/**
 * Creates a count and icon for an inventory card with optional link address. Used within `InventoryItemBody`.
 * @param {number} count - count for display
 * @param {React.ReactNode} icon - icon for display
 * @param {string} [linkTo] - (optional) link address
 * @example
 *  ```tsx
 *   return (
 *     <InventoryItem>
 *       <InventoryItemTitle>{title}</InventoryItemTitle>
 *       <InventoryItemBody error={loadError}>
 *         {loaded && <InventoryItemStatus count={workerNodes.length} icon={<MonitoringIcon />} />}
 *       </InventoryItemBody>
 *     </InventoryItem>
 *   )
 * ```
 */
export const InventoryItemStatus: React.FC<InventoryItemStatusProps> = require('@console/shared/src/components/dashboard/inventory-card/InventoryCard')
  .InventoryItemStatus;

/**
 * Creates a skeleton container for when an inventory card is loading. Used with `InventoryItem` and related components.
 * @example
 * ```tsx
 * if (loadError) {
 *    title = <Link to={workerNodesLink}>{t('Worker Nodes')}</Link>;
 * } else if (!loaded) {
 *   title = <><InventoryItemLoading /><Link to={workerNodesLink}>{t('Worker Nodes')}</Link></>;
 * }
 * return (
 *   <InventoryItem>
 *     <InventoryItemTitle>{title}</InventoryItemTitle>
 *   </InventoryItem>
 * )
 * ```
 */
export const InventoryItemLoading: React.FC = require('@console/shared/src/components/dashboard/inventory-card/InventoryCard')
  .InventoryItemLoading;

export { useFlag } from '../utils/flags';

/**
 * @deprecated Use [CodeEditor](#codeeditor) instead.
 * A basic lazy loaded YAML editor with hover help and completion.
 * @example
 * ```tsx
 * <React.Suspense fallback={<LoadingBox />}>
 *   <YAMLEditor
 *     value={code}
 *   />
 * </React.Suspense>
 * ```
 * @param {YAMLEditorProps['value']} value - String representing the yaml code to render.
 * @param {CodeEditorProps['language']} language - String representing the language of the editor.
 * @param {YAMLEditorProps['options']} options - Monaco editor options. For more details, see https://microsoft.github.io/monaco-editor/docs.html#interfaces/editor.IStandaloneEditorConstructionOptions.html.
 * @param {YAMLEditorProps['minHeight']} minHeight - Minimum editor height in valid CSS height values.
 * @param {YAMLEditorProps['showShortcuts']} showShortcuts - Boolean to show shortcuts on top of the editor.
 * @param {YAMLEditorProps['toolbarLinks']} toolbarLinks - Array of ReactNode rendered on the toolbar links section on top of the editor.
 * @param {YAMLEditorProps['onChange']} onChange - Callback for on code change event.
 * @param {YAMLEditorProps['onSave']} onSave - Callback called when the command `CTRL + S` / `CMD + S` is triggered.
 * @param {YAMLEditorRef} ref - React reference to `{ editor?: IStandaloneCodeEditor }`. Using the 'editor' property, you are able to access to all methods to control the editor. For more information, see https://microsoft.github.io/monaco-editor/docs.html#interfaces/editor.IStandaloneCodeEditor.html.
 */
export const YAMLEditor: React.ForwardRefExoticComponent<
  CodeEditorProps & React.RefAttributes<CodeEditorRef>
> = require('@console/internal/components/AsyncCodeEditor').AsyncCodeEditor;

/**
 * A basic lazy loaded Code editor with hover help and completion.
 * @example
 * ```tsx
 * <React.Suspense fallback={<LoadingBox />}>
 *   <CodeEditor
 *     value={code}
 *     language="yaml"
 *   />
 * </React.Suspense>
 * ```
 * @param {CodeEditorProps['value']} value - String representing the yaml code to render.
 * @param {CodeEditorProps['language']} language - String representing the language of the editor.
 * @param {CodeEditorProps['options']} options - Monaco editor options. For more details, please, visit https://microsoft.github.io/monaco-editor/docs.html#interfaces/editor.IStandaloneEditorConstructionOptions.html.
 * @param {CodeEditorProps['minHeight']} minHeight - Minimum editor height in valid CSS height values.
 * @param {CodeEditorProps['showShortcuts']} showShortcuts - Boolean to show shortcuts on top of the editor.
 * @param {CodeEditorProps['toolbarLinks']} toolbarLinks - Array of ReactNode rendered on the toolbar links section on top of the editor.
 * @param {CodeEditorProps['onChange']} onChange - Callback for on code change event.
 * @param {CodeEditorProps['onSave']} onSave - Callback called when the command CTRL / CMD + S is triggered.
 * @param {CodeEditorRef} ref - React reference to `{ editor?: IStandaloneCodeEditor }`. Using the 'editor' property, you are able to access to all methods to control the editor. For more information, visit https://microsoft.github.io/monaco-editor/docs.html#interfaces/editor.IStandaloneCodeEditor.html.
 */
export const CodeEditor: React.ForwardRefExoticComponent<
  CodeEditorProps & React.RefAttributes<CodeEditorRef>
> = require('@console/internal/components/AsyncCodeEditor').AsyncCodeEditor;

/**
 * A lazy loaded YAML editor for Kubernetes resources with hover help and completion.
 * The component uses the YAML editor and adds functionality, such as
 * resource update handling, alerts, save; cancel and reload buttons; and accessibility.
 * Unless `onSave` callback is provided, the resource update is automatically handled.
 * It should be wrapped in a `React.Suspense` component.
 * @example
 * ```tsx
 * <React.Suspense fallback={<LoadingBox />}>
 *   <ResourceYAMLEditor
 *     initialResource={resource}
 *     header="Create resource"
 *     onSave={(content) => updateResource(content)}
 *   />
 * </React.Suspense>
 * ```
 * @param {ResourceYAMLEditorProps['initialResource']} initialResource - YAML/Object representing a resource to be shown by the editor. This prop is used only during the inital render.
 * @param {ResourceYAMLEditorProps['header']} header - Add a header on top of the YAML editor.
 * @param {ResourceYAMLEditorProps['onSave']} onSave - Callback for the Save button. Passing it will override the default update performed on the resource by the editor.
 * @param {ResourceYAMLEditorProps['readOnly']} readOnly - Sets the YAML editor to read-only mode.
 * @param {ResourceYAMLEditorProps['create']} create - Editor will be on creation mode. Create button will replace the Save and Cancel buttons. If no onSave method defined, the 'Create' button will trigger the creation of the defined resource. Default: false
 * @param {ResourceYAMLEditorProps['onChange']} onChange - Callback triggered at any editor change.
 * @param {ResourceYAMLEditorProps['hideHeader']} hideHeader - On creation mode the editor by default show an header that can be hided with this property
 */
export const ResourceYAMLEditor: React.FC<ResourceYAMLEditorProps> = require('@console/internal/components/AsyncResourceYAMLEditor')
  .AsyncResourceYAMLEditor;

/**
 * A component to show events related to a particular resource.
 * @example
 * ```tsx
 * const [resource, loaded, loadError] = useK8sWatchResource(clusterResource);
 * return <ResourceEventStream resource={resource} />
 * ```
 * @param {K8sResourceCommon} resource - An object whose related events should be shown.
 */
export const ResourceEventStream: React.FC<ResourceEventStreamProps> = require('@console/internal/components/events')
  .WrappedResourceEventStream;

/**
 * A component to change the document title of the page.
 * @example
 * ```tsx
 * <DocumentTitle>My Page Title</DocumentTitle>
 * ```
 * This will change the title to "My Page Title · [Product Name]"
 *
 * @param {DocumentTitleProps['string']} children - The title to display
 */
export const DocumentTitle: React.FC<DocumentTitleProps> = require('@console/shared/src/components/document-title/DocumentTitle')
  .DocumentTitle;

/**
 * Sets up a poll to Prometheus for a single query with automatic refresh and error handling.
 *
 * This hook provides a convenient way to execute Prometheus queries with built-in polling,
 * error handling, and loading states for building monitoring dashboards and metrics views.
 *
 * **Common use cases:**
 * - Building custom monitoring dashboards
 * - Displaying resource metrics (CPU, memory, network)
 * - Creating alerting and health status indicators
 *
 * **Polling behavior:**
 * - Automatically refreshes data at specified intervals
 * - Pauses polling when component unmounts or query becomes empty
 * - Handles network errors and retries appropriately
 * - Optimizes requests to avoid unnecessary API calls
 *
 * **Query types:**
 * - `QUERY`: Instant vector queries for current values
 * - `QUERY_RANGE`: Range vector queries for time series data
 * - `LABEL`: Label value queries for dynamic filtering
 * - `RULES`: Recording and alerting rule queries
 *
 * **Error handling:**
 * - Network errors are caught and returned in error state
 * - Invalid PromQL syntax errors are handled gracefully
 * - Rate limiting and timeout errors trigger exponential backoff
 *
 * **Edge cases:**
 * - Empty or undefined query disables polling
 * - Invalid endpoint types default to QUERY
 * - Large result sets may be truncated by Prometheus
 * - Time range queries require appropriate time boundaries
 *
 * @example
 * ```tsx
 * // Basic CPU usage metric
 * const CPUUsageChart: React.FC<{podName: string}> = ({podName}) => {
 *   const [response, loaded, error] = usePrometheusPoll({
 *     endpoint: PrometheusEndpoint.QUERY,
 *     query: `rate(container_cpu_usage_seconds_total{pod="${podName}"}[5m])`,
 *     delay: 30000 // poll every 30 seconds
 *   });
 *
 *   if (error) {
 *     return <Alert variant="danger">Failed to load CPU metrics: {error.message}</Alert>;
 *   }
 *
 *   if (!loaded) {
 *     return <ChartSkeleton />;
 *   }
 *
 *   const cpuValue = response?.data?.result?.[0]?.value?.[1];
 *   return <MetricChart value={cpuValue} title="CPU Usage" />;
 * };
 * ```
 *
 * @example
 * ```tsx
 * // Time series data for graphing
 * const NetworkTrafficGraph: React.FC<{namespace: string}> = ({namespace}) => {
 *   const [response, loaded] = usePrometheusPoll({
 *     endpoint: PrometheusEndpoint.QUERY_RANGE,
 *     query: `sum(rate(container_network_receive_bytes_total{namespace="${namespace}"}[5m]))`,
 *     timespan: 60 * 60 * 1000, // 1 hour
 *     samples: 60, // 1 sample per minute
 *     delay: 60000 // update every minute
 *   });
 *
 *   const chartData = response?.data?.result?.[0]?.values?.map(([timestamp, value]) => ({
 *     x: new Date(timestamp * 1000),
 *     y: parseFloat(value)
 *   }));
 *
 *   return loaded && chartData ? (
 *     <LineChart data={chartData} />
 *   ) : (
 *     <GraphSkeleton />
 *   );
 * };
 * ```
 *
 * @example
 * ```tsx
 * // Dynamic label queries for filtering
 * const NamespaceSelector: React.FC = () => {
 *   const [response] = usePrometheusPoll({
 *     endpoint: PrometheusEndpoint.LABEL,
 *     query: 'namespace' // get all namespace label values
 *   });
 *
 *   const namespaces = response?.data || [];
 *
 *   return (
 *     <Select>
 *       {namespaces.map(ns => (
 *         <SelectOption key={ns} value={ns}>{ns}</SelectOption>
 *       ))}
 *     </Select>
 *   );
 * };
 * ```
 *
 * @param options Configuration object for Prometheus polling
 * @param options.endpoint The Prometheus API endpoint type (QUERY, QUERY_RANGE, LABEL, etc.)
 * @param options.query Optional Prometheus query string. If empty/undefined, polling is disabled
 * @param options.delay Optional polling interval in milliseconds. Defaults to 30000 (30 seconds)
 * @param options.endTime Optional end time for QUERY_RANGE endpoint (Unix timestamp)
 * @param options.samples Optional number of samples for QUERY_RANGE endpoint
 * @param options.timespan Optional time range duration for QUERY_RANGE endpoint in milliseconds
 * @param options.namespace Optional namespace parameter to append to query
 * @param options.timeout Optional request timeout parameter
 * @returns Tuple containing:
 *   - `response`: Prometheus query response object with data and metadata
 *   - `loaded`: Boolean indicating if the query has completed (true when data is available or error occurred)
 *   - `error`: Error object if query failed, null otherwise
 */
export const usePrometheusPoll: UsePrometheusPoll = (options) => {
  const result = require('@console/internal/components/graphs/prometheus-poll-hook').usePrometheusPoll(
    options,
  );
  // unify order with the rest of API
  return [result[0], !result[2], result[1]];
};

/**
 * A component to render timestamp with consistent formatting and user locale support.
 *
 * This component provides a standardized way to display timestamps throughout the Console
 * with automatic formatting, tooltips, and relative time updates.
 *
 * **Common use cases:**
 * - Displaying resource creation and modification times
 * - Showing event timestamps in chronological views
 * - Formatting dates in tables and detail views
 *
 * **Formatting behavior:**
 * - Automatically formats according to user's browser locale
 * - Shows relative time ("2 minutes ago") with absolute time in tooltip
 * - Updates relative times automatically as time passes
 * - Handles various input formats gracefully
 *
 * **Synchronization:**
 * - All timestamp instances update simultaneously for consistency
 * - Uses shared timer to minimize performance impact
 * - Maintains accurate relative times across the application
 *
 * **Input format support:**
 * - ISO 8601 strings (standard Kubernetes format)
 * - Unix epoch timestamps (numbers)
 * - JavaScript Date objects
 * - RFC 3339 formatted strings
 *
 * **Edge cases:**
 * - Invalid timestamps display as "Unknown"
 * - Future timestamps show as "in X time"
 * - Very old timestamps may show absolute dates instead of relative
 * - null/undefined timestamps render nothing
 *
 * @example
 * ```tsx
 * // Basic timestamp for resource creation time
 * const ResourceAge: React.FC<{resource: K8sResourceKind}> = ({resource}) => {
 *   return (
 *     <div>
 *       <span>Created: </span>
 *       <Timestamp timestamp={resource.metadata.creationTimestamp} />
 *     </div>
 *   );
 * };
 * ```
 *
 * @example
 * ```tsx
 * // Simple timestamp without icon/tooltip
 * const CompactTimestamp: React.FC<{time: string}> = ({time}) => {
 *   return (
 *     <Timestamp
 *       timestamp={time}
 *       simple={true}
 *       className="text-muted"
 *     />
 *   );
 * };
 * ```
 *
 * @example
 * ```tsx
 * // Event list with timestamps
 * const EventsList: React.FC<{events: EventKind[]}> = ({events}) => {
 *   return (
 *     <div className="events-list">
 *       {events.map(event => (
 *         <div key={event.metadata.uid} className="event-item">
 *           <Timestamp
 *             timestamp={event.firstTimestamp}
 *             omitSuffix={true}
 *           />
 *           <span>{event.message}</span>
 *         </div>
 *       ))}
 *     </div>
 *   );
 * };
 * ```
 *
 * @param timestamp The timestamp to render. Accepts ISO 8601 strings (Kubernetes standard), Unix epoch numbers, or Date objects
 * @param simple Optional boolean to render simple version without icon and tooltip (default: false)
 * @param omitSuffix Optional boolean to format date without "ago" suffix for relative times (default: false)
 * @param className Optional additional CSS class name for styling the component
 */
export const Timestamp: React.FC<TimestampProps> = require('@console/shared/src/components/datetime/Timestamp')
  .default;

export { useModal } from '../app/modal-support/useModal';
export type { ModalComponent } from '../app/modal-support/ModalProvider';

export { useOverlay } from '../app/modal-support/useOverlay';
export type { OverlayComponent } from '../app/modal-support/OverlayProvider';

/**
 * Component that allows to receive contributions from other plugins for the `console.action/provider` extension type.
 * See docs: https://github.com/openshift/console/blob/master/frontend/packages/console-dynamic-plugin-sdk/docs/console-extensions.md#consoleactionprovider
 *
 * @param {ActionServiceProviderProps["context"]} context - Object with contextId and optional plugin data
 * @example
 * ```tsx
 *    const context: ActionContext = { 'a-context-id': { dataFromDynamicPlugin } };
 *
 *    ...
 *
 *    <ActionServiceProvider context={context}>
 *        {({ actions, options, loaded }) =>
 *          loaded && (
 *            <ActionMenu actions={actions} options={options} variant={ActionMenuVariant.DROPDOWN} />
 *          )
 *        }
 *    </ActionServiceProvider>
 * ```
 */
export const ActionServiceProvider: React.FC<ActionServiceProviderProps> = require('@console/shared/src/components/actions/ActionServiceProvider')
  .default;

/**
 * A component that renders a horizontal toolbar with a namespace dropdown menu for namespace-aware pages.
 *
 * This component provides the standard namespace selection interface used throughout the Console
 * on pages that need to operate within a specific namespace context.
 *
 * **Common use cases:**
 * - Resource list pages that filter by namespace
 * - Dashboard pages showing namespace-specific metrics
 * - Forms that create resources in a selected namespace
 *
 * **Layout behavior:**
 * - Namespace dropdown is positioned on the left side
 * - Additional toolbar components render to the right
 * - Maintains consistent spacing and alignment
 * - Integrates with Console's standard page layout
 *
 * **Namespace management:**
 * - Automatically syncs with global namespace context
 * - Updates URL parameters when namespace changes
 * - Preserves other URL state during namespace switches
 * - Handles permissions and namespace access validation
 *
 * **Dropdown options:**
 * - Shows all accessible namespaces for the current user
 * - Includes "All Namespaces" option for cluster-wide views
 * - Filters namespaces based on RBAC permissions
 * - Sorts namespaces alphabetically for easy navigation
 *
 * **Edge cases:**
 * - Disabled state prevents namespace changes
 * - Invalid namespaces are filtered from dropdown
 * - Network errors may temporarily disable dropdown
 * - Some pages may not support "All Namespaces" view
 *
 * @example
 * ```tsx
 * // Basic namespace bar for resource listing page
 * const ResourceListPage: React.FC = () => {
 *   const handleNamespaceChange = (newNamespace: string) => {
 *     // Additional logic when namespace changes
 *     console.log(`Switched to namespace: ${newNamespace}`);
 *     // Clear any search/filter state that's namespace-specific
 *     setSearchTerm('');
 *   };
 *
 *   return (
 *     <>
 *       <NamespaceBar onNamespaceChange={handleNamespaceChange}>
 *         <Button variant="primary">Create Resource</Button>
 *         <RefreshButton />
 *       </NamespaceBar>
 *       <PageBody>
 *         <ResourceTable />
 *       </PageBody>
 *     </>
 *   );
 * };
 * ```
 *
 * @example
 * ```tsx
 * // Disabled namespace bar for cluster-scoped resources
 * const ClusterResourcePage: React.FC = () => {
 *   return (
 *     <>
 *       <NamespaceBar isDisabled={true}>
 *         <Breadcrumb>
 *           <BreadcrumbItem>Cluster Resources</BreadcrumbItem>
 *           <BreadcrumbItem>Nodes</BreadcrumbItem>
 *         </Breadcrumb>
 *       </NamespaceBar>
 *       <PageBody>
 *         <NodesList />
 *       </PageBody>
 *     </>
 *   );
 * };
 * ```
 *
 * @example
 * ```tsx
 * // Namespace bar with application selector
 * const ApplicationResourcesPage: React.FC = () => {
 *   return (
 *     <NamespaceBar>
 *       <ApplicationSelector />
 *       <LabelSelector />
 *       <ViewOptionsDropdown />
 *     </NamespaceBar>
 *   );
 * };
 * ```
 *
 * @param onNamespaceChange Optional callback function executed when namespace selection changes. Receives the new namespace string as argument. Useful for clearing filters or triggering data refreshes
 * @param isDisabled Optional boolean to disable the namespace dropdown while keeping the toolbar layout. Child components remain functional
 * @param children Optional React elements to render in the toolbar to the right of the namespace dropdown. Common elements include buttons, selectors, and breadcrumbs
 */
export const NamespaceBar: React.FC<NamespaceBarProps> = require('@console/internal/components/namespace-bar')
  .NamespaceBar;

/**
 * Creates a full page ErrorBoundaryFallbackPage component to display the "Something wrong happened" message along with the stack trace and other helpful debugging information.
 * This is to be used in conjunction with an `ErrorBoundary` component.
 *
 * @param {string} errorMessage - text description of the error message
 * @param {string} componentStack - component trace of the exception
 * @param {string} stack - stack trace of the exception
 * @param {string} title - title to render as the header of the error boundary page
 * @example
 *  ```tsx
 *  //in ErrorBoundary component
 *   return (
 *     if (this.state.hasError) {
 *       return <ErrorBoundaryFallbackPage errorMessage={errorString} componentStack={componentStackString}
 *        stack={stackTraceString} title={errorString}/>;
 *     }
 *
 *     return this.props.children;
 *   }
 *  )
 * ```
 */
export const ErrorBoundaryFallbackPage: React.FC<ErrorBoundaryFallbackProps> = require('@console/shared/src/components/error/fallbacks/ErrorBoundaryFallbackPage')
  .default;

/**
 * A component that renders a graph of the results from a Prometheus PromQL query along with controls for interacting with the graph.
 * @param {CustomDataSource} customDataSource - (optional) Base URL of an API endpoint that handles PromQL queries. If provided, this is used instead of the default API for fetching data.
 * @param {number} defaultSamples - (optional) The default number of data samples plotted for each data series. If there are many data series, QueryBrowser might automatically pick a lower number of data samples than specified here.
 * @param {number} defaultTimespan - (optional) The default timespan for the graph in milliseconds - defaults to 1,800,000 (30 minutes).
 * @param {PrometheusLabels[][]} disabledSeries - (optional) Disable (don't display) data series with these exact label / value pairs.
 * @param {boolean} disableZoom - (optional) Flag to disable the graph zoom controls.
 * @param {PrometheusLabels} filterLabels - (optional) Optionally filter the returned data series to only those that match these label / value pairs.
 * @param {number} fixedEndTime - (optional) Set the end time for the displayed time range rather than showing data up to the current time.
 * @param {(labels: PrometheusLabels, i?: number) => string} formatSeriesTitle - (optional) Function that returns a string to use as the title for a single data series.
 * @param {React.ComponentType<{}>} GraphLink - (optional) Component for rendering a link to another page (for example getting more information about this query).
 * @param {boolean} hideControls - (optional) Flag to hide the graph controls for changing the graph timespan, and so on.
 * @param {boolean} isStack - (optional) Flag to display a stacked graph instead of a line graph. If showStackedControl is set, it will still be possible for the user to switch to a line graph.
 * @param {string} namespace - (optional) If provided, data is only returned for this namespace (only series that have this namespace label).
 * @param {GraphOnZoom} onZoom - (optional) Callback called when the graph is zoomed.
 * @param {number} pollInterval - (optional) If set, determines how often the graph is updated to show the latest data (in milliseconds).
 * @param {string[]} queries - Array of PromQL queries to run and display the results in the graph.
 * @param {boolean} showLegend - (optional) Flag to enable displaying a legend below the graph.
 * @param {boolean} showStackedControl - Flag to enable displaying a graph control for switching between stacked graph mode and line graph mode.
 * @param {number} timespan - (optional) The timespan that should be covered by the graph in milliseconds.
 * @param {string} units - (optional) Units to display on the Y-axis and in the tooltip.
 * @example
 * ```tsx
 * <QueryBrowser
 *   defaultTimespan={15 * 60 * 1000}
 *   namespace={namespace}
 *   pollInterval={30 * 1000}
 *   queries={[
 *     'process_resident_memory_bytes{job="console"}',
 *     'sum(irate(container_network_receive_bytes_total[6h:5m])) by (pod)',
 *   ]}
 * />
 * ```
 */
export const QueryBrowser: React.FC<QueryBrowserProps> = require('@console/shared/src/components/query-browser')
  .QueryBrowser;

/**
 * A hook that provides a callback to launch a modal for editing Kubernetes resource annotations.
 *
 * This hook creates a standardized annotations editor that allows users to add, edit, and remove
 * annotations on any Kubernetes resource with proper validation and access control.
 *
 * **Common use cases:**
 * - Adding edit actions to resource detail pages
 * - Implementing annotation management in kebab menus
 * - Creating annotation-based workflows (e.g., setting deployment annotations)
 *
 * **Annotation handling:**
 * - Preserves existing annotations while allowing edits
 * - Validates annotation keys according to Kubernetes standards
 * - Handles special annotations (like finalizers) appropriately
 * - Supports both user-defined and system annotations
 *
 * **Access control:**
 * - Automatically validates user permissions to update the resource
 * - Handles RBAC for patch operations on the specific resource type
 * - Shows appropriate errors for insufficient permissions
 *
 * **Edge cases:**
 * - Returns no-op function if resource is undefined/null
 * - Handles read-only resources gracefully
 * - Preserves annotation formatting and encoding
 * - Validates annotation key/value constraints (length, characters, etc.)
 *
 * @example
 * ```tsx
 * // Basic annotations editor button
 * const EditAnnotationsButton: React.FC<{resource: K8sResourceCommon}> = ({resource}) => {
 *   const launchAnnotationsModal = useAnnotationsModal(resource);
 *   const { t } = useTranslation();
 *
 *   return (
 *     <Button
 *       variant="secondary"
 *       onClick={launchAnnotationsModal}
 *       isDisabled={!resource?.metadata}
 *     >
 *       {t('Edit Annotations')}
 *     </Button>
 *   );
 * };
 * ```
 *
 * @example
 * ```tsx
 * // Annotations action in kebab menu
 * const ResourceKebabActions: React.FC<{resource: K8sResourceCommon}> = ({resource}) => {
 *   const launchAnnotationsModal = useAnnotationsModal(resource);
 *
 *   const actions = [
 *     {
 *       label: 'Edit Annotations',
 *       callback: launchAnnotationsModal
 *     },
 *     // other actions...
 *   ];
 *
 *   return <KebabMenu actions={actions} />;
 * };
 * ```
 *
 * @example
 * ```tsx
 * // Conditional annotations editor based on permissions
 * const ConditionalAnnotationsEditor: React.FC<{pod: PodKind}> = ({pod}) => {
 *   const launchAnnotationsModal = useAnnotationsModal(pod);
 *   const [canUpdate] = useAccessReview({
 *     group: '',
 *     resource: 'pods',
 *     verb: 'patch',
 *     namespace: pod.metadata.namespace
 *   });
 *
 *   if (!canUpdate) {
 *     return <span>Annotations: {Object.keys(pod.metadata.annotations || {}).length}</span>;
 *   }
 *
 *   return <Link onClick={launchAnnotationsModal}>Edit Annotations</Link>;
 * };
 * ```
 *
 * @param resource The Kubernetes resource to edit annotations for. Must be a valid K8sResourceCommon object with metadata
 * @returns Function that when called, opens the annotations editor modal. Returns no-op if resource is invalid
 */
export const useAnnotationsModal: UseAnnotationsModal = require('@console/shared/src/hooks/useAnnotationsModal')
  .useAnnotationsModal;

/**
 * A hook that provides a callback to launch a modal for deleting Kubernetes resources.
 *
 * This hook creates a standardized delete confirmation modal that handles resource deletion
 * with proper validation, access control, and user feedback.
 *
 * **Common use cases:**
 * - Adding delete buttons to resource rows in tables
 * - Implementing delete actions in kebab menus
 * - Creating bulk delete operations
 *
 * **Access control:**
 * - Modal automatically checks user permissions before allowing deletion
 * - Handles RBAC validation for the specific resource and namespace
 * - Shows appropriate error messages for insufficient permissions
 *
 * **Deletion behavior:**
 * - Performs proper Kubernetes API calls with error handling
 * - Shows loading states during deletion process
 * - Handles finalizers and graceful deletion timeouts
 * - Automatically updates resource watches after successful deletion
 *
 * **Edge cases:**
 * - Returns no-op function if resource is undefined/null
 * - Handles resources with protection finalizers
 * - Gracefully fails if resource no longer exists
 * - Supports cascade deletion for resources with dependents
 *
 * @example
 * ```tsx
 * // Basic delete button for a single resource
 * const DeletePodButton: React.FC<{pod: PodKind}> = ({pod}) => {
 *   const launchDeleteModal = useDeleteModal(pod);
 *   const { t } = useTranslation();
 *
 *   return (
 *     <Button
 *       variant="danger"
 *       onClick={launchDeleteModal}
 *       isDisabled={!pod}
 *     >
 *       {t('Delete Pod')}
 *     </Button>
 *   );
 * };
 * ```
 *
 * @example
 * ```tsx
 * // Delete with custom redirect and message
 * const DeleteDeploymentAction: React.FC<{deployment: DeploymentKind}> = ({deployment}) => {
 *   const navigate = useNavigate();
 *   const launchDeleteModal = useDeleteModal(
 *     deployment,
 *     '/k8s/all-namespaces/deployments', // redirect after deletion
 *     'This will permanently delete the deployment and all its pods.',
 *     'Delete Deployment'
 *   );
 *
 *   return <MenuItem onClick={launchDeleteModal}>Delete</MenuItem>;
 * };
 * ```
 *
 * @example
 * ```tsx
 * // Bulk delete with custom delete function
 * const BulkDeleteButton: React.FC<{selectedPods: PodKind[]}> = ({selectedPods}) => {
 *   const deleteAllPods = async () => {
 *     await Promise.all(selectedPods.map(pod => k8sDelete({model: PodModel, resource: pod})));
 *   };
 *
 *   const launchDeleteModal = useDeleteModal(
 *     selectedPods[0], // primary resource for modal context
 *     undefined,
 *     `Delete ${selectedPods.length} pods?`,
 *     'Delete All',
 *     deleteAllPods
 *   );
 *
 *   return <Button onClick={launchDeleteModal} variant="danger">Delete Selected</Button>;
 * };
 * ```
 *
 * @param resource The Kubernetes resource to delete. Must be a valid K8sResourceCommon object with metadata
 * @param redirectTo Optional URL to navigate to after successful deletion. Can be string path or LocationDescriptor object
 * @param message Optional custom message to display in the confirmation modal. Defaults to standard deletion warning
 * @param btnText Optional text for the delete button. Defaults to "Delete"
 * @param deleteAllResources Optional custom function to handle deletion. If provided, overrides default deletion behavior. Useful for bulk operations or custom cleanup logic
 * @returns Function that when called, opens the delete confirmation modal. Returns no-op if resource is invalid
 */
export const useDeleteModal: UseDeleteModal = require('@console/shared/src/hooks/useDeleteModal')
  .useDeleteModal;

/**
 * A hook that provides a callback to launch a modal for editing Kubernetes resource labels.
 *
 * This hook creates a standardized labels editor that allows users to add, edit, and remove
 * labels on any Kubernetes resource with proper validation and access control.
 *
 * **Common use cases:**
 * - Adding edit actions to resource detail pages
 * - Implementing label management in kebab menus
 * - Creating label-based workflows (e.g., setting service selectors)
 *
 * **Label handling:**
 * - Preserves existing labels while allowing edits
 * - Validates label keys and values according to Kubernetes standards
 * - Handles both user-defined and system labels appropriately
 * - Supports label selectors and matching logic
 *
 * **Access control:**
 * - Automatically validates user permissions to update the resource
 * - Handles RBAC for patch operations on the specific resource type
 * - Shows appropriate errors for insufficient permissions
 *
 * **Validation:**
 * - Enforces Kubernetes label key/value format rules
 * - Prevents invalid characters and length violations
 * - Validates DNS subdomain and name requirements
 * - Warns about system/reserved label prefixes
 *
 * **Edge cases:**
 * - Returns no-op function if resource is undefined/null
 * - Handles read-only resources gracefully
 * - Preserves label formatting and encoding
 * - Prevents editing of protected system labels
 *
 * @example
 * ```tsx
 * // Basic labels editor button
 * const EditLabelsButton: React.FC<{resource: K8sResourceCommon}> = ({resource}) => {
 *   const launchLabelsModal = useLabelsModal(resource);
 *   const { t } = useTranslation();
 *
 *   return (
 *     <Button
 *       variant="secondary"
 *       onClick={launchLabelsModal}
 *       isDisabled={!resource?.metadata}
 *     >
 *       {t('Edit Labels')}
 *     </Button>
 *   );
 * };
 * ```
 *
 * @example
 * ```tsx
 * // Labels action for service selector management
 * const ServiceLabelsEditor: React.FC<{service: ServiceKind}> = ({service}) => {
 *   const launchLabelsModal = useLabelsModal(service);
 *   const labelCount = Object.keys(service.spec?.selector || {}).length;
 *
 *   return (
 *     <div>
 *       <span>Selector: {labelCount} labels</span>
 *       <Button variant="link" onClick={launchLabelsModal}>
 *         Edit Selector
 *       </Button>
 *     </div>
 *   );
 * };
 * ```
 *
 * @param resource The Kubernetes resource to edit labels for. Must be a valid K8sResourceCommon object with metadata
 * @returns Function that when called, opens the labels editor modal. Returns no-op if resource is invalid
 */
export const useLabelsModal: UseLabelsModal = require('@console/shared/src/hooks/useLabelsModal')
  .useLabelsModal;

/**
 * Hook that provides the currently active namespace and a callback for setting the active namespace.
 *
 * This hook integrates with the Console's global namespace context, which affects resource listings,
 * routing, and access control throughout the application.
 *
 * **Common use cases:**
 * - Building namespace-aware components that filter resources
 * - Creating custom namespace selectors
 * - Implementing namespace-scoped operations
 *
 * **Special values:**
 * - Returns `undefined` when no namespace is selected (cluster-scoped view)
 * - Returns `"#ALL_NS#"` constant when "All Namespaces" is selected
 * - For namespaced resources, always returns a specific namespace string
 *
 * **Routing integration:**
 * - Changing namespace automatically updates URL parameters
 * - Namespace changes trigger navigation to maintain consistency
 * - Preserves other URL state (filters, search terms, etc.)
 *
 * **Edge cases:**
 * - Initial value may be `undefined` during app bootstrap
 * - Setting an invalid namespace name may cause access issues
 * - Some pages may override namespace behavior (e.g., cluster settings)
 *
 * @example
 * ```tsx
 * // Basic namespace-aware resource listing
 * const ResourceList: React.FC = () => {
 *   const [activeNamespace] = useActiveNamespace();
 *   const [resources] = useK8sWatchResources({
 *     pods: {
 *       kind: 'Pod',
 *       namespace: activeNamespace, // automatically filters by namespace
 *       isList: true
 *     }
 *   });
 *
 *   return <PodsList data={resources.pods.data} />;
 * };
 * ```
 *
 * @example
 * ```tsx
 * // Custom namespace selector with validation
 * const NamespaceSelector: React.FC = () => {
 *   const [activeNamespace, setActiveNamespace] = useActiveNamespace();
 *   const [namespaces] = useK8sWatchResource({kind: 'Namespace', isList: true});
 *
 *   const handleChange = (newNamespace: string) => {
 *     // Validate namespace exists before setting
 *     if (namespaces.some(ns => ns.metadata.name === newNamespace)) {
 *       setActiveNamespace(newNamespace);
 *     }
 *   };
 *
 *   return (
 *     <select value={activeNamespace || ''} onChange={e => handleChange(e.target.value)}>
 *       <option value="">All Namespaces</option>
 *       {namespaces.map(ns => (
 *         <option key={ns.metadata.name} value={ns.metadata.name}>
 *           {ns.metadata.name}
 *         </option>
 *       ))}
 *     </select>
 *   );
 * };
 * ```
 *
 * @returns Tuple containing:
 *   - `activeNamespace`: Currently selected namespace string, `undefined` for all namespaces, or special constant for cluster-wide view
 *   - `setActiveNamespace`: Function to change the active namespace, accepts namespace string or `undefined` for all namespaces
 */
export const useActiveNamespace: UseActiveNamespace = require('@console/shared/src/hooks/useActiveNamespace')
  .useActiveNamespace;

/**
 * Hook that provides a user setting value and a callback for setting the user setting value.
 *
 * This hook integrates with the Console's user settings system, allowing plugins to store
 * and retrieve user preferences that persist across sessions.
 *
 * **Common use cases:**
 * - Storing user interface preferences (theme, layout, default values)
 * - Persisting form state and user selections
 * - Managing feature flags and user-specific configurations
 *
 * **Storage behavior:**
 * - Settings are stored in user's ConfigMap or localStorage fallback
 * - Values persist across browser sessions and page reloads
 * - Settings are user-specific and don't affect other users
 *
 * **Setting key format:**
 * - Use dot notation for hierarchical settings (e.g., 'plugin.feature.option')
 * - Plugin settings should be prefixed with plugin name
 * - System settings use reserved prefixes
 *
 * **Edge cases:**
 * - Returns default value if setting hasn't been set yet
 * - May return stale value briefly during async loading
 * - Setting undefined values removes the setting
 * - Complex objects are JSON serialized/deserialized
 *
 * @example
 * ```tsx
 * // Basic preference storage
 * const PreferenceComponent: React.FC = () => {
 *   const [showAdvanced, setShowAdvanced, loaded] = useUserSettings(
 *     'myPlugin.showAdvancedOptions',
 *     false, // default value
 *     true   // sync immediately
 *   );
 *
 *   if (!loaded) {
 *     return <Loading />;
 *   }
 *
 *   return (
 *     <>
 *       <Checkbox
 *         isChecked={showAdvanced}
 *         onChange={setShowAdvanced}
 *         label="Show advanced options"
 *       />
 *       {showAdvanced && <AdvancedOptionsPanel />}
 *     </>
 *   );
 * };
 * ```
 *
 * @example
 * ```tsx
 * // Complex object storage
 * interface DashboardLayout {
 *   cards: string[];
 *   columns: number;
 *   collapsed: boolean;
 * }
 *
 * const DashboardCustomizer: React.FC = () => {
 *   const [layout, setLayout, loaded] = useUserSettings<DashboardLayout>(
 *     'dashboard.layout',
 *     {cards: ['overview', 'resources'], columns: 2, collapsed: false}
 *   );
 *
 *   const updateLayout = (newLayout: Partial<DashboardLayout>) => {
 *     setLayout({...layout, ...newLayout});
 *   };
 *
 *   return loaded ? (
 *     <DashboardGrid
 *       layout={layout}
 *       onLayoutChange={updateLayout}
 *     />
 *   ) : <DashboardSkeleton />;
 * };
 * ```
 *
 * @example
 * ```tsx
 * // Conditional rendering based on settings
 * const FeatureGatedComponent: React.FC = () => {
 *   const [enableBetaFeatures, , loaded] = useUserSettings(
 *     'global.enableBetaFeatures',
 *     false
 *   );
 *
 *   return (
 *     <>
 *       <StandardFeatures />
 *       {loaded && enableBetaFeatures && <BetaFeatures />}
 *     </>
 *   );
 * };
 * ```
 *
 * @returns Tuple containing:
 *   - `value`: Current setting value, or default value if not set
 *   - `setValue`: Function to update the setting value, accepts new value or function that receives current value
 *   - `loaded`: Boolean indicating if the setting has been loaded from storage
 */
export const useUserSettings: UseUserSettings = require('@console/shared/src/hooks/useUserSettings')
  .useUserSettings;

/**
 * Hook that provides the current quick start context values for plugin integration with Console quick starts.
 *
 * Quick starts are guided tutorials that help users learn Console features and workflows.
 * This hook allows plugins to integrate with the quick start system programmatically.
 *
 * **Common use cases:**
 * - Launching quick starts from custom UI elements
 * - Tracking quick start progress for analytics
 * - Creating contextual help that opens relevant quick starts
 *
 * **Context values provided:**
 * - `activeQuickStartID`: Currently active quick start identifier
 * - `setActiveQuickStart`: Function to programmatically start a quick start
 * - `allQuickStartStates`: Map of all quick start states and progress
 * - `setQuickStartState`: Function to update quick start completion state
 *
 * **Quick start lifecycle:**
 * - Quick starts can be in progress, completed, or not started
 * - Users can pause and resume quick starts
 * - Progress is persisted across sessions
 *
 * **Edge cases:**
 * - Setting invalid quick start ID fails silently
 * - Quick starts may not be available in all Console configurations
 * - Context values may be undefined during initial load
 *
 * @example
 * ```tsx
 * // Button to launch a specific quick start
 * const LaunchTutorialButton: React.FC<{quickStartId: string, title: string}> = ({quickStartId, title}) => {
 *   const { setActiveQuickStart, allQuickStartStates } = useQuickStartContext();
 *   const quickStartState = allQuickStartStates[quickStartId];
 *
 *   const handleClick = React.useCallback(() => {
 *     setActiveQuickStart(quickStartId);
 *   }, [quickStartId, setActiveQuickStart]);
 *
 *   const isCompleted = quickStartState?.status === 'Complete';
 *   const buttonText = isCompleted ? `Review ${title}` : `Start ${title}`;
 *
 *   return (
 *     <Button variant={isCompleted ? 'secondary' : 'primary'} onClick={handleClick}>
 *       {buttonText}
 *       {isCompleted && <CheckCircleIcon className="ml-2" />}
 *     </Button>
 *   );
 * };
 * ```
 *
 * @example
 * ```tsx
 * // Contextual help component
 * const ContextualHelp: React.FC<{feature: string}> = ({feature}) => {
 *   const { setActiveQuickStart } = useQuickStartContext();
 *
 *   const quickStartMap = {
 *     'deployments': 'deploy-application-quickstart',
 *     'monitoring': 'monitoring-quickstart',
 *     'networking': 'networking-quickstart'
 *   };
 *
 *   const relevantQuickStart = quickStartMap[feature];
 *
 *   if (!relevantQuickStart) {
 *     return null;
 *   }
 *
 *   return (
 *     <Button
 *       variant="link"
 *       isInline
 *       onClick={() => setActiveQuickStart(relevantQuickStart)}
 *     >
 *       <QuestionCircleIcon /> Learn about {feature}
 *     </Button>
 *   );
 * };
 * ```
 *
 * @example
 * ```tsx
 * // Quick start progress indicator
 * const QuickStartProgress: React.FC<{quickStartId: string}> = ({quickStartId}) => {
 *   const { allQuickStartStates } = useQuickStartContext();
 *   const quickStartState = allQuickStartStates[quickStartId];
 *
 *   if (!quickStartState) {
 *     return <Badge variant="outline">Not Started</Badge>;
 *   }
 *
 *   const { status, taskNumber, totalTasks } = quickStartState;
 *
 *   return (
 *     <div className="quick-start-progress">
 *       <Badge variant={status === 'Complete' ? 'success' : 'info'}>
 *         {status === 'Complete' ? 'Completed' : `${taskNumber}/${totalTasks}`}
 *       </Badge>
 *     </div>
 *   );
 * };
 * ```
 *
 * @returns QuickStartContextValues object containing:
 *   - `activeQuickStartID`: String ID of currently active quick start, null if none active
 *   - `setActiveQuickStart`: Function to start a quick start by ID
 *   - `allQuickStartStates`: Object mapping quick start IDs to their current state and progress
 *   - `setQuickStartState`: Function to programmatically update quick start state
 *   - Additional context values for advanced quick start management
 */
export const useQuickStartContext: UseQuickStartContext = require('@console/shared/src/hooks/useQuickStartContext')
  .useQuickStartContext;
