import * as React from 'react';
import { CatalogType } from '@console/dev-console/src/components/catalog/utils/types';
import { CatalogItem } from '@console/dynamic-plugin-sdk';
import {
  getQueryArgument,
  removeQueryArgument,
  setQueryArgument,
  history,
} from '@console/internal/components/utils';
import { useTelemetry } from '@console/shared/src/hooks/useTelemetry';
import QuickSearchBar from './QuickSearchBar';
import QuickSearchContent from './QuickSearchContent';
import { QuickSearchDetailsRendererProps } from './QuickSearchDetails';
import { CatalogLinkData, QuickSearchData } from './utils/quick-search-types';
import { handleCta } from './utils/quick-search-utils';

import './QuickSearchModalBody.scss';

interface QuickSearchModalBodyProps {
  allCatalogItemsLoaded: boolean;
  searchCatalog: (searchTerm: string) => QuickSearchData;
  searchPlaceholder: string;
  namespace: string;
  closeModal: () => void;
  limitItemCount: number;
  icon?: React.ReactNode;
  detailsRenderer?: (props: QuickSearchDetailsRendererProps) => React.ReactNode;
}

const QuickSearchModalBody: React.FC<QuickSearchModalBodyProps> = ({
  searchCatalog,
  namespace,
  closeModal,
  limitItemCount,
  searchPlaceholder,
  allCatalogItemsLoaded,
  icon,
  detailsRenderer,
}) => {
  const [catalogItems, setCatalogItems] = React.useState<CatalogItem[]>(null);
  const [catalogTypes, setCatalogTypes] = React.useState<CatalogType[]>([]);
  const [searchTerm, setSearchTerm] = React.useState<string>(
    getQueryArgument('catalogSearch') || '',
  );
  const [selectedItemId, setSelectedItemId] = React.useState<string>('');
  const [selectedItem, setSelectedItem] = React.useState<CatalogItem>(null);
  const [viewAll, setViewAll] = React.useState<CatalogLinkData[]>(null);
  const listCatalogItems =
    limitItemCount > 0 ? catalogItems?.slice(0, limitItemCount) : catalogItems;
  const ref = React.useRef<HTMLDivElement>(null);
  const fireTelemetryEvent = useTelemetry();

  React.useEffect(() => {
    if (searchTerm) {
      const { filteredItems, viewAllLinks, catalogItemTypes } = searchCatalog(searchTerm);
      setCatalogItems(filteredItems);
      setCatalogTypes(catalogItemTypes);
      setViewAll(viewAllLinks);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchCatalog]);

  React.useEffect(() => {
    if (catalogItems && !selectedItemId) {
      setSelectedItemId(catalogItems[0]?.uid);
      setSelectedItem(catalogItems[0]);
    }
  }, [catalogItems, selectedItemId]);

  const onSearch = React.useCallback(
    (value: string) => {
      setSearchTerm(value);
      if (value) {
        const { filteredItems, viewAllLinks, catalogItemTypes } = searchCatalog(value);
        setCatalogItems(filteredItems);
        setCatalogTypes(catalogItemTypes);
        setViewAll(viewAllLinks);
        setQueryArgument('catalogSearch', value);
      } else {
        setCatalogItems(null);
        removeQueryArgument('catalogSearch');
      }
      setSelectedItemId('');
      setSelectedItem(null);
    },
    [searchCatalog],
  );

  const onCancel = React.useCallback(() => {
    const searchInput = ref.current?.firstElementChild?.children?.[1] as HTMLInputElement;
    if (searchInput?.value) {
      document.activeElement !== searchInput && searchInput.focus();
      onSearch('');
    } else {
      closeModal();
    }
  }, [closeModal, onSearch]);

  const getIndexOfSelectedItem = React.useCallback(
    () => listCatalogItems?.findIndex((item) => item.uid === selectedItemId),
    [listCatalogItems, selectedItemId],
  );

  const onEnter = React.useCallback(
    (e) => {
      const { id } = document.activeElement;
      const activeViewAllLink = viewAll?.find((link) => link.catalogType === id);
      if (activeViewAllLink) {
        history.push(activeViewAllLink.to);
      } else if (selectedItem) {
        handleCta(e, selectedItem, closeModal, fireTelemetryEvent);
      }
    },
    [closeModal, fireTelemetryEvent, selectedItem, viewAll],
  );

  const selectPrevious = React.useCallback(() => {
    let index = getIndexOfSelectedItem();
    if (index === 0) index = listCatalogItems?.length;
    setSelectedItemId(listCatalogItems?.[index - 1]?.uid);
    setSelectedItem(listCatalogItems?.[index - 1]);
  }, [listCatalogItems, getIndexOfSelectedItem]);

  const selectNext = React.useCallback(() => {
    const index = getIndexOfSelectedItem();
    setSelectedItemId(listCatalogItems?.[index + 1]?.uid);
    setSelectedItem(listCatalogItems?.[index + 1]);
  }, [listCatalogItems, getIndexOfSelectedItem]);

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'Escape': {
          onCancel();
          break;
        }
        case 'ArrowUp': {
          e.preventDefault();
          selectPrevious();
          break;
        }
        case 'ArrowDown': {
          e.preventDefault();
          selectNext();
          break;
        }
        case 'Enter': {
          onEnter(e);
          break;
        }
        default:
      }
    };

    const onOutsideClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) {
        closeModal();
      }
    };

    document.addEventListener('click', onOutsideClick);
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('click', onOutsideClick);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [closeModal, onCancel, onEnter, selectNext, selectPrevious]);

  const getModalHeight = () => {
    let height: number = 60;
    const itemsHeight = viewAll?.length ? 388 : 365;
    if (catalogItems?.length > 0) {
      height += itemsHeight + (viewAll?.length - 1) * 23;
    }
    return height;
  };

  return (
    <div ref={ref} className="odc-quick-search-modal-body" style={{ height: getModalHeight() }}>
      <QuickSearchBar
        searchTerm={searchTerm}
        searchPlaceholder={searchPlaceholder}
        onSearch={onSearch}
        showNoResults={catalogItems?.length === 0}
        itemsLoaded={allCatalogItemsLoaded}
        icon={icon}
        autoFocus
      />
      {catalogItems && selectedItem && (
        <QuickSearchContent
          catalogItems={catalogItems}
          catalogItemTypes={catalogTypes}
          viewAll={viewAll}
          searchTerm={searchTerm}
          selectedItemId={selectedItemId}
          closeModal={closeModal}
          selectedItem={selectedItem}
          namespace={namespace}
          limitItemCount={limitItemCount}
          detailsRenderer={detailsRenderer}
          onSelect={(itemId) => {
            setSelectedItemId(itemId);
            setSelectedItem(catalogItems?.find((item) => item.uid === itemId));
          }}
        />
      )}
    </div>
  );
};

export default QuickSearchModalBody;
