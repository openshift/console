import * as React from 'react';
import { VerticalTabs, VerticalTabsTab } from '@patternfly/react-catalog-view-extension';
import * as _ from 'lodash';
import { CatalogCategories } from '../utils/types';

type CatalogCategoriesProp = {
  categories: CatalogCategories;
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

  const hasActiveDescendant = (activeId, category) => {
    if (_.has(category.subcategories, activeId)) {
      return true;
    }

    return _.some(category.subcategories, (subcategory) =>
      hasActiveDescendant(activeId, subcategory),
    );
  };

  const isActiveTab = (activeId, category) => {
    return _.has(category.subcategories, activeId);
  };

  const renderTabs = (category, selectedCategoryId) => {
    if (!categorizedIds[category.id]) return null;

    const { id, label, subcategories, numItems } = category;
    const active = id === selectedCategory;
    const shown = _.has(categories, id);

    const tabClasses = `text-capitalize${!numItems ? ' co-catalog-tab__empty' : ''}`;

    return (
      <VerticalTabsTab
        key={id}
        title={label}
        active={active}
        className={tabClasses}
        onActivate={() => onSelectCategory(id)}
        hasActiveDescendant={hasActiveDescendant(selectedCategory, category)}
        shown={shown}
      >
        {subcategories && (
          <VerticalTabs restrictTabs activeTab={isActiveTab(selectedCategoryId, category)}>
            {_.map(subcategories, (subcategory) => renderTabs(subcategory, selectedCategoryId))}
          </VerticalTabs>
        )}
      </VerticalTabsTab>
    );
  };

  return (
    <VerticalTabs restrictTabs activeTab={activeTab}>
      {_.map(categories, (category) => renderTabs(category, selectedCategory))}
    </VerticalTabs>
  );
};

export default CatalogCategories;
