import * as React from 'react';
import PaneBody from '@console/shared/src/components/layout/PaneBody';

/**
 * Container component that provides the main body layout for list pages.
 *
 * This component wraps the main content area of list pages with consistent styling
 * and layout patterns used throughout the Console. It provides proper spacing,
 * responsive behavior, and integration with the Console's page layout system.
 *
 * **Common use cases:**
 * - Wrapping table components in resource list pages
 * - Container for filtered list views with toolbars
 * - Main content area for custom list implementations
 *
 * **Layout behavior:**
 * - Provides consistent padding and spacing for list content
 * - Integrates with Console's responsive grid system
 * - Handles overflow and scrolling for large lists
 * - Maintains proper focus management for accessibility
 *
 * **Styling integration:**
 * - Uses PatternFly design tokens for consistent theming
 * - Inherits Console's standard page layout patterns
 * - Supports both light and dark theme modes
 * - Responsive design adapts to different screen sizes
 *
 * **Edge cases:**
 * - Handles empty content gracefully
 * - Works with dynamic content that changes size
 * - Supports nested scrollable areas when needed
 *
 * @example
 * ```tsx
 * // Basic list page structure
 * const PodListPage: React.FC = () => {
 *   const [pods, loaded, error] = useK8sWatchResource({
 *     kind: 'Pod',
 *     isList: true
 *   });
 *
 *   return (
 *     <>
 *       <ListPageHeader title="Pods" />
 *       <ListPageBody>
 *         <VirtualizedTable
 *           data={pods}
 *           loaded={loaded}
 *           loadError={error}
 *           columns={podColumns}
 *           Row={PodRow}
 *         />
 *       </ListPageBody>
 *     </>
 *   );
 * };
 * ```
 *
 * @example
 * ```tsx
 * // List page with filters and toolbar
 * const FilteredResourceList: React.FC = () => {
 *   return (
 *     <>
 *       <ListPageHeader title="Resources">
 *         <Button variant="primary">Create Resource</Button>
 *       </ListPageHeader>
 *       <ListPageBody>
 *         <ListPageFilter
 *           data={resources}
 *           rowFilters={filters}
 *           onFilterChange={handleFilterChange}
 *         />
 *         <ResourceTable filteredData={filteredResources} />
 *       </ListPageBody>
 *     </>
 *   );
 * };
 * ```
 *
 * @example
 * ```tsx
 * // Custom list with additional content
 * const CustomListPage: React.FC = () => {
 *   return (
 *     <>
 *       <ListPageHeader title="Dashboard" />
 *       <ListPageBody>
 *         <Overview>
 *           <OverviewGrid mainCards={dashboardCards} />
 *         </Overview>
 *         <ResourceTable data={resources} />
 *         <Pagination />
 *       </ListPageBody>
 *     </>
 *   );
 * };
 * ```
 *
 * @param children React elements to render within the list page body container. Typically includes tables, filters, pagination, and other list-related components
 */
const ListPageBody: React.FC = ({ children }) => {
  return <PaneBody>{children}</PaneBody>;
};

export default ListPageBody;
