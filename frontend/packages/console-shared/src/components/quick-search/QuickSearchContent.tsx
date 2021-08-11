import * as React from 'react';
import { Split, SplitItem, Divider } from '@patternfly/react-core';
import cx from 'classnames';
import { CatalogType } from '@console/dev-console/src/components/catalog/utils/types';
import { CatalogItem } from '@console/dynamic-plugin-sdk';
import QuickSearchDetails, { DetailsRendererFunction } from './QuickSearchDetails';
import QuickSearchList from './QuickSearchList';
import './QuickSearchContent.scss';
import { CatalogLinkData } from './utils/quick-search-types';

const MAX_CATALOG_ITEMS_SHOWN = 5;

interface QuickSearchContentProps {
  catalogItems: CatalogItem[];
  catalogItemTypes: CatalogType[];
  searchTerm: string;
  namespace: string;
  selectedItemId: string;
  selectedItem: CatalogItem;
  onSelect: (itemId: string) => void;
  viewAll?: CatalogLinkData[];
  closeModal: () => void;
  limitItemCount: number;
  detailsRenderer?: DetailsRendererFunction;
}

const QuickSearchContent: React.FC<QuickSearchContentProps> = ({
  catalogItems,
  catalogItemTypes,
  viewAll,
  searchTerm,
  namespace,
  selectedItem,
  selectedItemId,
  onSelect,
  closeModal,
  limitItemCount,
  detailsRenderer,
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
          listItems={limitItemCount > 0 ? catalogItems.slice(0, limitItemCount) : catalogItems}
          catalogItemTypes={catalogItemTypes}
          viewAll={viewAll}
          selectedItemId={selectedItemId}
          searchTerm={searchTerm}
          namespace={namespace}
          onSelectListItem={onSelect}
          closeModal={closeModal}
        />
      </SplitItem>
      <Divider component="div" isVertical />
      <SplitItem className="odc-quick-search-content__details">
        <QuickSearchDetails
          detailsRenderer={detailsRenderer}
          selectedItem={selectedItem}
          closeModal={closeModal}
        />
      </SplitItem>
    </Split>
  );
};

export default QuickSearchContent;
