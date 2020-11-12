// import * as React from 'react';
// import * as _ from 'lodash';
// import {
//   FilterSidePanel,
//   FilterSidePanelCategory,
//   FilterSidePanelCategoryItem,
// } from '@patternfly/react-catalog-view-extension';

// export const FilterTypes = {
//   category: 'category',
//   keyword: 'keyword',
// };

// const CatalogSidebar: React.FC = ({
//   activeFilters,
//   onFilterChange,
//   filterGroupNameMap,
//   filterGroupsShowAll,
//   onShowAllToggle,
// }) => {
//   const renderCatalogFilterGroups = (
//     filterGroup,
//     groupName,
//     activeFilters,
//     filterCounts,
//     onFilterChange,
//     // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
//     onUpdateFilters,
//   ) => {
//     return (
//       <FilterSidePanelCategory
//         key={groupName}
//         title={filterGroupNameMap[groupName] || groupName}
//         onShowAllToggle={() => onShowAllToggle(groupName)}
//         showAll={_.get(filterGroupsShowAll, groupName, false)}
//         data-test-group-name={groupName}
//       >
//         {_.map(filterGroup, (filter, filterName) => {
//           const { label, active } = filter;
//           return (
//             <FilterSidePanelCategoryItem
//               key={filterName}
//               count={_.get(filterCounts, [groupName, filterName], 0)}
//               checked={active}
//               onClick={(e) => onFilterChange(groupName, filterName, e.target.checked)}
//               title={label}
//               data-test={`${groupName}-${_.kebabCase(filterName)}`}
//             >
//               {label}
//             </FilterSidePanelCategoryItem>
//           );
//         })}
//       </FilterSidePanelCategory>
//     );
//   };

//   const renderCatalogFilters = () => {
//     const { activeFilters, filterCounts } = this.state;

//     return (
//       <FilterSidePanel>
//         {_.map(activeFilters, (filterGroup, groupName) => {
//           if (groupName === FilterTypes.keyword) {
//             return;
//           }
//           return renderFilterGroup(
//             filterGroup,
//             groupName,
//             activeFilters,
//             filterCounts,
//             this.onFilterChange,
//             this.onUpdateFilters,
//           );
//         })}
//       </FilterSidePanel>
//     );
//   };

//   return (
//     <div className="co-catalog-page__tabs">
//       {/* {this.renderCategoryTabs(activeCategory.id)} */}
//       {renderCatalogFilters()}
//     </div>
//   );
// };

// export default CatalogSidebar;
