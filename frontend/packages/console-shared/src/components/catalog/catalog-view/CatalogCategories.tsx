import * as React from 'react';
import { VerticalTabs, VerticalTabsTab } from '@patternfly/react-catalog-view-extension';
import * as cx from 'classnames';
import * as _ from 'lodash';
import { getURLWithParams } from '../utils/catalog-utils';
import { hasActiveDescendant, isActiveTab } from '../utils/category-utils';
import { CatalogCategory, CatalogQueryParams } from '../utils/types';

type CatalogCategoriesProp = {
  categories: CatalogCategory[];
  categorizedIds: Record<string, string[]>;
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
};

const CatalogCategories: React.FC<CatalogCategoriesProp> = ({
  categories,
  categorizedIds,
  selectedCategory,
  onSelectCategory,
}) => {
  const activeTab = _.has(categories, selectedCategory);

  const renderTabs = (
    category: CatalogCategory & { numItems?: number },
    selectedCategoryID: string,
    toplevelCategory: boolean,
  ) => {
    if (!categorizedIds[category.id]) return null;

    const { id, label, subcategories, numItems } = category;
    const active = id === selectedCategory;

    // eslint-disable-next-line @typescript-eslint/naming-convention
    const tabClasses = cx('text-capitalize', { 'co-catalog-tab__empty': !numItems });

    return (
      <VerticalTabsTab
        key={id}
        title={label}
        active={active}
        className={tabClasses}
        onActivate={() => onSelectCategory(id)}
        hasActiveDescendant={hasActiveDescendant(selectedCategory, category)}
        shown={toplevelCategory}
        data-test={`tab ${id}`}
        href={getURLWithParams(CatalogQueryParams.CATEGORY, id)}
      >
        {subcategories && (
          <VerticalTabs restrictTabs activeTab={isActiveTab(selectedCategoryID, category)}>
            {_.map(subcategories, (subcategory) =>
              renderTabs(subcategory, selectedCategoryID, false),
            )}
          </VerticalTabs>
        )}
      </VerticalTabsTab>
    );
  };

  return (
    <VerticalTabs restrictTabs activeTab={activeTab} data-test="catalog-categories">
      {_.map(categories, (category) => renderTabs(category, selectedCategory, true))}
    </VerticalTabs>
  );
};

export default CatalogCategories;
