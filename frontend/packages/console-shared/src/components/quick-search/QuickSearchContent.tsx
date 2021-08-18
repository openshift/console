import * as React from 'react';
import { Split, SplitItem, Divider } from '@patternfly/react-core';
import cx from 'classnames';
import { CatalogType } from '@console/dev-console/src/components/catalog/utils/types';
import { CatalogItem } from '@console/dynamic-plugin-sdk';
import QuickSearchDetails, { DetailsRendererFunction } from './QuickSearchDetails';
import QuickSearchList from './QuickSearchList';
import './QuickSearchContent.scss';
import { CatalogLinkData } from './utils/quick-search-types';

interface QuickSearchContentProps {
  catalogItems: CatalogItem[];
  catalogItemTypes: CatalogType[];
  searchTerm: string;
  namespace: string;
  selectedItemId: string;
  selectedItem: CatalogItem;
  limitItemCount?: number;
  onSelect: (itemId: string) => void;
  viewAll?: CatalogLinkData[];
  closeModal: () => void;
  detailsRenderer?: DetailsRendererFunction;
  onListChange?: (items: number) => void;
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
  onListChange,
}) => {
  return (
    <Split className="ocs-quick-search-content">
      <SplitItem
        className={cx('ocs-quick-search-content__list', {
          'ocs-quick-search-content__list--overflow': catalogItems.length >= limitItemCount,
        })}
      >
        <QuickSearchList
          listItems={catalogItems}
          limitItemCount={limitItemCount}
          catalogItemTypes={catalogItemTypes}
          viewAll={viewAll}
          selectedItemId={selectedItemId}
          searchTerm={searchTerm}
          namespace={namespace}
          onSelectListItem={onSelect}
          closeModal={closeModal}
          onListChange={onListChange}
        />
      </SplitItem>
      <Divider component="div" isVertical />
      <SplitItem className="ocs-quick-search-content__details">
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
