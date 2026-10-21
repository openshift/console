import type { FC } from 'react';
import { Split, SplitItem, Divider } from '@patternfly/react-core';
import { css } from '@patternfly/react-styles';
import type { CatalogItem } from '@console/dynamic-plugin-sdk';
import type { CatalogType } from '../catalog';
import type { DetailsRendererFunction } from './QuickSearchDetails';
import QuickSearchDetails from './QuickSearchDetails';
import QuickSearchList from './QuickSearchList';
import type { CatalogLinkData } from './utils/quick-search-types';
import './QuickSearchContent.scss';

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

const QuickSearchContent: FC<QuickSearchContentProps> = ({
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
    <Split className="ocs-quick-search-content" tabIndex={-1}>
      <SplitItem
        className={css('ocs-quick-search-content__list pf-v6-u-pt-xs', {
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
          onSelectListItem={(_event, itemId) => onSelect(itemId)}
          closeModal={closeModal}
          onListChange={onListChange}
        />
      </SplitItem>
      <Divider component="div" orientation={{ default: 'vertical' }} tabIndex={-1} />
      <SplitItem className="ocs-quick-search-content__details pf-v6-u-pt-xs">
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
