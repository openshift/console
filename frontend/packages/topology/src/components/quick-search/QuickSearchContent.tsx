import * as React from 'react';
import cx from 'classnames';
import { CatalogItem } from '@console/dynamic-plugin-sdk';
import { Split, SplitItem, Divider } from '@patternfly/react-core';
import QuickSearchDetails from './QuickSearchDetails';
import QuickSearchList from './QuickSearchList';
import './QuickSearchContent.scss';
import { CatalogLinkData } from './utils/quick-search-types';

const MAX_CATALOG_ITEMS_SHOWN = 5;

interface QuickSearchContentProps {
  catalogItems: CatalogItem[];
  searchTerm: string;
  namespace: string;
  selectedItemId: string;
  selectedItem: CatalogItem;
  onSelect: (itemId: string) => void;
  viewAll?: CatalogLinkData[];
}

const QuickSearchContent: React.FC<QuickSearchContentProps> = ({
  catalogItems,
  viewAll,
  searchTerm,
  namespace,
  selectedItem,
  selectedItemId,
  onSelect,
}) => {
  return (
    <Split className="odc-quick-search-content">
      <SplitItem
        className={cx('odc-quick-search-content__list', {
          'odc-quick-search-content__list--overflow':
            catalogItems.length >= MAX_CATALOG_ITEMS_SHOWN,
        })}
      >
        <QuickSearchList
          listItems={catalogItems.slice(0, MAX_CATALOG_ITEMS_SHOWN)}
          viewAll={viewAll}
          selectedItemId={selectedItemId}
          searchTerm={searchTerm}
          namespace={namespace}
          onSelectListItem={onSelect}
        />
      </SplitItem>
      <Divider component="div" isVertical />
      <SplitItem className="odc-quick-search-content__details">
        <QuickSearchDetails selectedItem={selectedItem} />
      </SplitItem>
    </Split>
  );
};

export default QuickSearchContent;
