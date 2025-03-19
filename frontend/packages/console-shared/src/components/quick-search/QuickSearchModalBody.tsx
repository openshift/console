import * as React from 'react';
import { ModalBody, ModalHeader } from '@patternfly/react-core';
import { CatalogItem } from '@console/dynamic-plugin-sdk';
import {
  getQueryArgument,
  removeQueryArgument,
  setQueryArgument,
  history,
} from '@console/internal/components/utils';
import { useTelemetry } from '../../hooks/useTelemetry';
import { CatalogType } from '../catalog';
import QuickSearchBar from './QuickSearchBar';
import QuickSearchContent from './QuickSearchContent';
import { DetailsRendererFunction } from './QuickSearchDetails';
import { CatalogLinkData, QuickSearchData } from './utils/quick-search-types';
import { handleCta } from './utils/quick-search-utils';

interface QuickSearchModalBodyProps {
  allCatalogItemsLoaded: boolean;
  searchCatalog: (searchTerm: string) => QuickSearchData;
  searchPlaceholder: string;
  namespace: string;
  closeModal: () => void;
  limitItemCount?: number;
  icon?: React.ReactNode;
  detailsRenderer?: DetailsRendererFunction;
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
  const [items, setItems] = React.useState<number>(limitItemCount);
  const ref = React.useRef<HTMLInputElement>();
  const fireTelemetryEvent = useTelemetry();
  const listCatalogItems = limitItemCount > 0 ? catalogItems?.slice(0, items) : catalogItems;

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
    (_event: React.FormEvent<HTMLInputElement>, value: string) => {
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
    const searchInput = ref?.current as HTMLInputElement;
    if (searchInput?.value) {
      document.activeElement !== searchInput && searchInput.focus();
      onSearch(null, '');
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

  const handleListChange = (i: number) => {
    setItems(i);
  };

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'Escape': {
          e.preventDefault();
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
          e.preventDefault();
          onEnter(e);
          break;
        }
        case 'Space': {
          if (e.ctrlKey) {
            e.preventDefault();
            closeModal();
          }
          break;
        }
        default:
      }
    };

    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [closeModal, onCancel, onEnter, selectNext, selectPrevious]);

  return (
    <>
      <ModalHeader className="pf-v6-u-p-md pf-v6-u-pb-0">
        <QuickSearchBar
          searchTerm={searchTerm}
          searchPlaceholder={searchPlaceholder}
          onSearch={onSearch}
          showNoResults={catalogItems?.length === 0}
          itemsLoaded={allCatalogItemsLoaded}
          icon={icon}
          autoFocus
          ref={ref}
        />
      </ModalHeader>
      <ModalBody className="pf-v6-u-p-md pf-v6-u-pt-0" style={{ minHeight: 0 }}>
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
            onListChange={handleListChange}
            onSelect={(itemId) => {
              setSelectedItemId(itemId);
              setSelectedItem(catalogItems?.find((item) => item.uid === itemId));
            }}
          />
        )}
      </ModalBody>
    </>
  );
};

export default QuickSearchModalBody;
