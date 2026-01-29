import type { FC } from 'react';
import { Split, SplitItem, Divider } from '@patternfly/react-core';
import { css } from '@patternfly/react-styles';
import { CatalogItem } from '@console/dynamic-plugin-sdk';
import { CatalogType } from '../catalog';
import QuickSearchDetails, { DetailsRendererFunction } from './QuickSearchDetails';
import QuickSearchList from './QuickSearchList';
import { CatalogLinkData } from './utils/quick-search-types';
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
  navigate: (url: string) => void;
  removeQueryArgument: (key: string) => void;
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
  navigate,
  removeQueryArgument,
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
          navigate={navigate}
          removeQueryArgument={removeQueryArgument}
        />
      </SplitItem>
      <Divider component="div" orientation={{ default: 'vertical' }} tabIndex={-1} />
      <SplitItem className="ocs-quick-search-content__details pf-v6-u-pt-xs">
        <QuickSearchDetails
          detailsRenderer={detailsRenderer}
          selectedItem={selectedItem}
          closeModal={closeModal}
          navigate={navigate}
          removeQueryArgument={removeQueryArgument}
        />
      </SplitItem>
    </Split>
  );
};

export default QuickSearchContent;
