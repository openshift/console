/* eslint-disable */
import * as React from 'react';
import { ActionServiceProviderProps } from '../extensions/actions';
import {
  ErrorBoundaryFallbackProps,
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
  ResourceIconProps,
  OverviewProps,
  OverviewGridProps,
  InventoryItemTitleProps,
  InventoryItemBodyProps,
  InventoryItemStatusProps,
  YAMLEditorProps,
  ResourceYAMLEditorProps,
  ResourceEventStreamProps,
  UsePrometheusPoll,
  TimestampProps,
  NamespaceBarProps,
  YAMLEditorRef,
} from '../extensions/console-types';
import { StatusPopupSectionProps, StatusPopupItemProps } from '../extensions/dashboard-types';

export * from '../app/components';
export * from './common-types';

/**
 * React hook for consuming Console extensions with resolved `CodeRef` properties.
 * This hook accepts the same argument(s) as `useExtensions` hook and returns an adapted list of extension instances, resolving all code references within each extension's properties.
 * Initially, the hook returns an empty array. Once the resolution is complete, the React component is re-rendered with the hook returning an adapted list of extensions.
 * When the list of matching extensions changes, the resolution is restarted. The hook will continue to return the previous result until the resolution completes.
 * The hook's result elements are guaranteed to be referentially stable across re-renders.
 * @example
 * ```ts
 * const [navItemExtensions, navItemsResolved] = useResolvedExtensions<NavItem>(isNavItem);
 * // process adapted extensions and render your component
 * ```
 * @param typeGuards A list of callbacks that each accept a dynamic plugin extension as an argument and return a boolean flag indicating whether or not the extension meets desired type constraints
 * @returns Tuple containing a list of adapted extension instances with resolved code references, a boolean flag indicating whether the resolution is complete, and a list of errors detected during the resolution.
 */
export const useResolvedExtensions: UseResolvedExtensions = require('@console/dynamic-plugin-sdk/src/api/useResolvedExtensions')
  .useResolvedExtensions;

/**
 * A component that creates a Navigation bar for a page.
 *
 * - Routing is handled as part of the component.
 * - `console.tab/horizontalNav` can be used to add additional content to any horizontal nav.
 * @param {object} [resource] - The resource associated with this Navigation, an object of K8sResourceCommon type
 * @param {NavPage[]} pages - An array of page objects
 * @param {object} match - match object provided by React Router
 * @example
 * ```ts
 * const HomePage: React.FC = (props) => {
 *     const page = {
 *       href: '/home',
 *       name: 'Home',
 *       component: () => <>Home</>
 *     }
 *     return <HorizontalNav match={props.match} pages={[page]} />
 * }
 * ```
 */
export const HorizontalNav: React.FC<HorizontalNavProps> = require('@console/internal/components/utils/horizontal-nav')
  .HorizontalNavFacade;

/**
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
 *     </>
 *   );
 * };
 * ```
 */
export const TableData: React.FC<TableDataProps> = require('@console/internal/components/factory/Table/VirtualizedTable')
  .TableData;

/**
 * A hook that provides a list of user-selected active TableColumns.
 * @param options - Which are passed as a key-value map
 * @param {TableColumn<D>[]} options.columns - An array of all available TableColumns
 * @param {boolean} [options.showNamespaceOverride] - (optional) If true, a namespace column will be included, regardless of column management selections
 * @param {string} [options.columnManagementID] - (optional) A unique id used to persist and retrieve column management selections to and from user settings. Usually a 'group~verion~kind' string for a resource.
 * @returns A tuple containing the current user selected active columns (a subset of options.columns), and a boolean flag indicating whether user settings have been loaded.
 * @example
 * ```tsx
 *   // See implementation for more details on TableColumn type
 *   const [activeColumns, userSettingsLoaded] = useActiveColumns({
 *     columns,
 *     showNamespaceOverride: false,
 *     columnManagementID,
 *   });
 *   return userSettingsAreLoaded ? <VirtualizedTable columns={activeColumns} {...otherProps} /> : null
 * ```
 */
export const useActiveColumns: UseActiveColumns = require('@console/internal/components/factory/Table/active-columns-hook')
  .useActiveColumns;

/**
 * Component for generating a page header
 * @param {string} title - heading title
 * @param {ReactNode} [helpText] -  (optional) help section as react node
 * @param {ReactNode} [badge] -  (optional) badge icon as react node
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
 * Component for adding a create button for a specific resource kind that automatically generates a link to the create YAML for this resource
 * @param {GroupVersionKind} groupVersionKind - the resource group/version/kind to represent
 * @example
 * ```ts
 * const exampleList: React.FC<MyProps> = () => {
 *   return (
 *     <>
 *       <ListPageHeader title="Example Pod List Page"/>
 *         <ListPageCreate groupVersionKind="Pod">Create Pod</ListPageCreate>
 *       </ListPageHeader>
 *     </>
 *   );
 * };
 * ```
 */
export const ListPageCreate: React.FC<ListPageCreateProps> = require('@console/internal/components/factory/ListPage/ListPageCreate')
  .default;

/**
 * Component for creating a stylized link
 * @param {string} to - string location where link should direct
 * @param {object} [createAccessReview] -  (optional) object with namespace and kind used to determine access
 * @param {ReactNode} [children] -  (optional) children for the component
 * @example
 * ```ts
 * const exampleList: React.FC<MyProps> = () => {
 *  return (
 *   <>
 *    <ListPageHeader title="Example Pod List Page"/>
 *       <ListPageCreateLink to={'/link/to/my/page'}>Create Item</ListPageCreateLink>
 *    </ListPageHeader>
 *   </>
 *  );
 * };
 * ```
 */
export const ListPageCreateLink: React.FC<ListPageCreateLinkProps> = require('@console/internal/components/factory/ListPage/ListPageCreate')
  .ListPageCreateLink;

/**
 * Component for creating button
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
 * Component for creating a dropdown wrapped with permissions check
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
 * Component that generates filter for list page
 * @param {D} data - An array of data points
 * @param {boolean} loaded - indicates that data has loaded
 * @param {function} onFilterChange - callback function for when filter is updated
 * @param {RowFilter[]} [rowFilters] - (optional) An array of RowFilter elements that define the available filter options
 * @param {string} [nameFilterPlaceholder] -  (optional) placeholder for name filter
 * @param {string} [labelFilterPlaceholder] -  (optional) placeholder for label filter
 * @param {boolean} [hideLabelFilter] -  (optional) only shows the name filter instead of both name and label filter
 * @param {boolean} [hideNameLabelFilter] -  (optional) hides both name and label filter
 * @param {ColumnLayout} [columnLayout] -  (optional) column layout object
 * @param {boolean} [hideColumnManagement] -  (optional) flag to hide the column management
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
export const ListPageFilter: React.FC<ListPageFilterProps> = require('@console/internal/components/factory/ListPage/ListPageFilter')
  .default;

/**
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
 * Component that creates a link to a specific resource type with an icon badge
 * @param {K8sResourceKindReference} [kind] - (optional) the kind of resource i.e. Pod, Deployment, Namespace
 * @param {K8sGroupVersionKind} [groupVersionKind] - (optional) object with groupd, version, and kind
 * @param {string} [className] -  (optional) class style for component
 * @param {string} [displayName] -  (optional) display name for component, overwrites the resource name if set
 * @param {boolean} [inline=false] -  (optional) flag to create icon badge and name inline with children
 * @param {boolean} [linkTo=true] -  (optional) flag to create a Link object - defaults to true
 * @param {string} [name] -  (optional) name of resource
 * @param {string} [namesapce] -  (optional) specific namespace for the kind resource to link to
 * @param {boolean} [hideIcon] -  (optional) flag to hide the icon badge
 * @param {string} [title] -  (optional) title for the link object (not displayed)
 * @param {string} [dataTest] -  (optional) identifier for testing
 * @param {function} [onClick] -  (optional) callback function for when component is clicked
 * @param {boolean} [truncate=false] -  (optional) flag to truncate the link if too long
 * @example
 * ```tsx
 *   <ResourceLink
 *       kind="Pod"
 *       name="testPod"
 *       title={metadata.uid}
 *   />
 * ```
 */
export const ResourceLink: React.FC<ResourceLinkProps> = require('@console/internal/components/utils/resource-link')
  .ResourceLink;
export { default as ResourceStatus } from '../app/components/utils/resource-status';

/**
 * Component that creates an icon badge for a specific resource type
 * @param {K8sResourceKindReference} [kind] - (optional) the kind of resource i.e. Pod, Deployment, Namespace
 * @param {K8sGroupVersionKind} [groupVersionKind] - (optional) object with group, version, and kind
 * @param {string} [className] -  (optional) class style for component
 * @example
 * ```tsx
 * <ResourceIcon kind="Pod"/>
 * ```
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
 * Component that shows the status in a popup window. Helpful component for building `console.dashboards/overview/health/resource` extensions
 * @param {ReactNode} firstColumn - values for first column of popup
 * @param {ReactNode} [secondColumn] - (optional) values for second column of popup
 * @param {ReactNode} [children] -  (optional) children for the popup
 * @example
 * ```tsx
 *   <StatusPopupSection
 *     firstColumn={
 *       <>
 *         <span>{title}</span>
 *         <span className="text-secondary">
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
 * Status element used in status popup; used in `StatusPopupSection`
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
 * Creates a wrapper component for a dashboard
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
 * Creates a grid of card elements for a dashboard; used within `Overview`
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
 * Creates an inventory card item
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
 * Creates a title for an inventory card item; used within `InventoryItem`
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
 * Creates the body of an inventory card; used within `InventoryCard` and can be used with `InventoryTitle`
 * @param {React.ReactNode} children - elements to render inside the Inventory Card or title
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
 * Creates a count and icon for an inventory card with optional link address; used within `InventoryItemBody`
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
 * Creates a skeleton container for when an inventory card is loading; used with `InventoryItem` and related components
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
 * @param {YAMLEditorProps['options']} options - Monaco editor options. For more details, please, visit https://microsoft.github.io/monaco-editor/api/interfaces/monaco.editor.IStandaloneEditorConstructionOptions.html.
 * @param {YAMLEditorProps['minHeight']} minHeight - Minimum editor height in valid CSS height values.
 * @param {YAMLEditorProps['showShortcuts']} showShortcuts - Boolean to show shortcuts on top of the editor.
 * @param {YAMLEditorProps['toolbarLinks']} toolbarLinks - Array of ReactNode rendered on the toolbar links section on top of the editor.
 * @param {YAMLEditorProps['onChange']} onChange - Callback for on code change event.
 * @param {YAMLEditorProps['onSave']} onSave - Callback called when the command CTRL / CMD + S is triggered.
 * @param {YAMLEditorRef} ref - React reference to `{ editor?: IStandaloneCodeEditor }`. Using the 'editor' property, you are able to access to all methods to control the editor. For more information, visit https://microsoft.github.io/monaco-editor/api/interfaces/monaco.editor.IStandaloneCodeEditor.html.
 */
export const YAMLEditor: React.ForwardRefExoticComponent<YAMLEditorProps & React.RefAttributes<YAMLEditorRef>> = require('@console/internal/components/AsyncYAMLEditor')
  .AsyncYAMLEditor;

/**
 * A lazy loaded YAML editor for Kubernetes resources with hover help and completion.
 * The component use the YAMLEditor and add on top of it more functionality like
 * resource update handling, alerts, save, cancel and reload buttons, accessibility and more.
 * Unless onSave callback is provided, the resource update is automatically handled.
 * It should be wrapped in a React.Suspense component.
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
 * @param {ResourceYAMLEditorProps['initialResource']} initialResource - YAML/Object representing a resource to be shown by the editor. This prop is used only during the inital render
 * @param {ResourceYAMLEditorProps['header']} header - Add a header on top of the YAML editor
 * @param {ResourceYAMLEditorProps['onSave']} onSave - Callback for the Save button. Passing it will override the default update performed on the resource by the editor
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
 * Sets up a poll to Prometheus for a single query.
 * @param {PrometheusEndpoint} props.endpoint - one of the PrometheusEndpoint (label, query, range, rules, targets)
 * @param {string} [props.query] - (optional) Prometheus query string. If empty or undefined, polling is not started.
 * @param {number} [props.delay] - (optional) polling delay interval (ms)
 * @param {number} [props.endTime] - (optional) for QUERY_RANGE enpoint, end of the query range
 * @param {number} [props.samples] - (optional) for QUERY_RANGE enpoint
 * @param {number} [options.timespan] - (optional) for QUERY_RANGE enpoint
 * @param {string} [options.namespace] - (optional) a search param to append
 * @param {string} [options.timeout] - (optional) a search param to append
 * @returns A tuple containing the query response, a boolean flag indicating whether the response has completed, and any errors encountered during the request or post-processing of the request
 */
export const usePrometheusPoll: UsePrometheusPoll = (options) => {
  const result = require('@console/internal/components/graphs/prometheus-poll-hook').usePrometheusPoll(
    options,
  );
  // unify order with the rest of API
  return [result[0], !result[2], result[1]];
};

/**
 * A component to render timestamp.
 * The timestamps are synchronized between invidual instances of the Timestamp component.
 * The provided timestamp is formatted according to user locale.
 *
 * @param {TimestampProps['timestamp']} timestamp - the timestamp to render. Format is expected to be ISO 8601 (used by Kubernetes), epoch timestamp, or an instance of a Date.
 * @param {TimestampProps['simple']} simple - render simple version of the component omitting icon and tooltip.
 * @param {TimestampProps['omitSuffix']} omitSuffix - formats the date ommiting the suffix.
 * @param {TimestampProps['className']} className - additional class name for the component.
 */
export const Timestamp: React.FC<TimestampProps> = require('@console/internal/components/utils/timestamp')
  .Timestamp;

export { useModal } from '../app/modal-support/useModal';

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
 * A component that renders a horizontal toolbar with a namespace dropdown menu in the leftmost position. Additional components can be passed in as children and will be rendered to the right of the namespace dropdown. This component is designed to be used at the top of the page. It should be used on pages where the user needs to be able to change the active namespace, such as on pages with k8s resources.
 * @param {function} onNamespaceChange - (optional) A function that is executed when a namespace option is selected. It accepts the new namespace in the form of a string as its only argument. The active namespace is updated automatically when an option is selected, but additional logic can be applied via this function. When the namespace is changed, the namespace parameter in the URL will be changed from the previous namespace to the newly selected namespace.
 * @param {boolean} isDisabled - (optional) A boolean flag that disables the namespace dropdown if set to true. This option only applies to the namespace dropdown and has no effect on child components.
 * @param {React.ReactNode} children - (optional) Additional elements to be rendered inside the toolbar to the right of the namespace dropdown.
 * @example
 * ```tsx
 *    const logNamespaceChange = (namespace) => console.log(`New namespace: ${namespace}`);
 *
 *    ...
 *
 *    <NamespaceBar onNamespaceChange={logNamespaceChange}>
 *      <NamespaceBarApplicationSelector />
 *    </NamespaceBar>
 *    <Page>
 *
 *      ...
 * ```
 */
export const NamespaceBar: React.FC<NamespaceBarProps> = require('@console/internal/components/namespace-bar')
  .NamespaceBar;

/**
 * Creates full page ErrorBoundaryFallbackPage component to display the "Oh no! Something went wrong."
 * message along with the stack trace and other helpful debugging information. This is to be used in
 * conjunction with an <ErrorBoundary> component.
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
