import * as React from 'react';
import { SearchInput } from '@patternfly/react-core';
import * as _ from 'lodash';
import * as ReactDOM from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Dropdown } from '@console/internal/components/utils';
import { NO_GROUPING } from '../utils/category-utils';
import { CatalogSortOrder, CatalogStringMap } from '../utils/types';

type CatalogToolbarProps = {
  title: string;
  totalItems: number;
  searchKeyword: string;
  sortOrder: CatalogSortOrder;
  groupings: CatalogStringMap;
  activeGrouping: string;
  onGroupingChange: (grouping: string) => void;
  onSearchKeywordChange: (searchKeyword: string) => void;
  onSortOrderChange: (sortOrder: CatalogSortOrder) => void;
};

// TODO: update to use inputRef on SearchInput once https://github.com/patternfly/patternfly-react/issues/5168 is fixed.
const CatalogToolbar = React.forwardRef<HTMLInputElement, CatalogToolbarProps>(
  (
    {
      title,
      totalItems,
      searchKeyword,
      sortOrder,
      groupings,
      activeGrouping,
      onGroupingChange,
      onSearchKeywordChange,
      onSortOrderChange,
    },
    toolbarRef,
  ) => {
    const { t } = useTranslation();
    const inputRef = React.useRef<HTMLDivElement>();

    const catalogSortItems = {
      [CatalogSortOrder.ASC]: t('devconsole~A-Z'),
      [CatalogSortOrder.DESC]: t('devconsole~Z-A'),
    };

    const showGrouping = !_.isEmpty(groupings);

    const catalogGroupItems = {
      ...groupings,
      [NO_GROUPING]: t('devconsole~None'),
    };

    React.useImperativeHandle(toolbarRef, () => {
      // TODO: Remove this hack once https://github.com/patternfly/patternfly-react/issues/5168 is fixed.
      // eslint-disable-next-line react/no-find-dom-node
      const toolbarDOMNode = ReactDOM.findDOMNode(inputRef.current) as HTMLDivElement;
      return toolbarDOMNode.querySelector('.pf-c-search-input__text-input') as HTMLInputElement;
    });

    return (
      <div className="co-catalog-page__header">
        <div className="co-catalog-page__heading text-capitalize">{title}</div>
        <div className="co-catalog-page__filter">
          <div ref={inputRef}>
            <SearchInput
              className="co-catalog-page__input"
              data-test="search-catalog"
              type="text"
              placeholder={t('devconsole~Filter by keyword...')}
              value={searchKeyword}
              onChange={onSearchKeywordChange}
              onClear={() => onSearchKeywordChange('')}
              aria-label={t('devconsole~Filter by keyword...')}
            />
            <Dropdown
              className="co-catalog-page__sort"
              items={catalogSortItems}
              title={catalogSortItems[sortOrder]}
              onChange={onSortOrderChange}
            />
            {showGrouping && (
              <Dropdown
                className="co-catalog-page__btn-group__group-by"
                menuClassName="dropdown-menu--text-wrap"
                items={catalogGroupItems}
                onChange={onGroupingChange}
                titlePrefix={t('devconsole~Group by')}
                title={catalogGroupItems[activeGrouping]}
              />
            )}
          </div>
          <div className="co-catalog-page__num-items">
            {t('devconsole~{{totalItems}} items', { totalItems })}
          </div>
        </div>
      </div>
    );
  },
);

export default CatalogToolbar;
