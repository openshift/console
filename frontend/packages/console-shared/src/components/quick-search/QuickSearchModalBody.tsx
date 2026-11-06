import type { ReactNode, FC, FormEvent } from 'react';
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { ModalBody, ModalHeader } from '@patternfly/react-core';
import { useNavigate } from 'react-router';
import type { CatalogItem } from '@console/dynamic-plugin-sdk';
import { useQueryParamsMutator } from '@console/shared/src/hooks/useQueryParamsMutator';
import { useTelemetry } from '../../hooks/useTelemetry';
import type { CatalogType } from '../catalog/utils/types';
import QuickSearchBar from './QuickSearchBar';
import QuickSearchContent from './QuickSearchContent';
import type { DetailsRendererFunction } from './QuickSearchDetails';
import type { CatalogLinkData, QuickSearchData } from './utils/quick-search-types';
import { handleCta } from './utils/quick-search-utils';

interface QuickSearchModalBodyProps {
  allCatalogItemsLoaded: boolean;
  searchCatalog: (searchTerm: string) => QuickSearchData;
  searchPlaceholder: string;
  namespace: string;
  closeModal: () => void;
  limitItemCount?: number;
  icon?: ReactNode;
  detailsRenderer?: DetailsRendererFunction;
}

const QuickSearchModalBody: FC<QuickSearchModalBodyProps> = ({
  searchCatalog,
  namespace,
  closeModal,
  limitItemCount,
  searchPlaceholder,
  allCatalogItemsLoaded,
  icon,
  detailsRenderer,
}) => {
  const { getQueryArgument, setQueryArgument, removeQueryArgument } = useQueryParamsMutator();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState<string>(getQueryArgument('catalogSearch') || '');
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<CatalogItem>(null);
  const [items, setItems] = useState<number>(limitItemCount);
  const ref = useRef<HTMLInputElement>(undefined);
  const fireTelemetryEvent = useTelemetry();

  // Derive the search results from the search term and the catalog data, so that they also
  // update when the catalog items finish loading (i.e. when `searchCatalog` changes)
  const { catalogItems, catalogTypes, viewAll } = useMemo<{
    catalogItems: CatalogItem[];
    catalogTypes: CatalogType[];
    viewAll: CatalogLinkData[];
  }>(() => {
    if (!searchTerm) {
      return { catalogItems: null, catalogTypes: [], viewAll: null };
    }
    const { filteredItems, viewAllLinks, catalogItemTypes } = searchCatalog(searchTerm);
    return {
      catalogItems: filteredItems,
      catalogTypes: catalogItemTypes,
      viewAll: viewAllLinks,
    };
  }, [searchTerm, searchCatalog]);

  const currentSelectedItemId = selectedItemId || catalogItems?.[0]?.uid;
  const currentSelectedItem = selectedItem || catalogItems?.[0];

  const listCatalogItems = limitItemCount > 0 ? catalogItems?.slice(0, items) : catalogItems;

  const onSearch = useCallback(
    (_event: FormEvent<HTMLInputElement>, value: string) => {
      setSearchTerm(value);
      if (value) {
        setQueryArgument('catalogSearch', value);
      } else {
        removeQueryArgument('catalogSearch');
      }
      setSelectedItemId('');
      setSelectedItem(null);
    },
    [setQueryArgument, removeQueryArgument],
  );

  const onCancel = useCallback(() => {
    const searchInput = ref?.current as HTMLInputElement;
    if (searchInput?.value) {
      document.activeElement !== searchInput && searchInput.focus();
      onSearch(null, '');
    } else {
      closeModal();
    }
  }, [closeModal, onSearch]);

  const getIndexOfSelectedItem = useCallback(
    () => listCatalogItems?.findIndex((item) => item.uid === currentSelectedItemId),
    [listCatalogItems, currentSelectedItemId],
  );

  const onEnter = useCallback(
    (e) => {
      const { id } = document.activeElement;
      const activeViewAllLink = viewAll?.find((link) => link.catalogType === id);
      if (activeViewAllLink) {
        navigate(activeViewAllLink.to);
      } else if (currentSelectedItem) {
        handleCta(
          e,
          currentSelectedItem,
          closeModal,
          fireTelemetryEvent,
          navigate,
          removeQueryArgument,
        );
      }
    },
    [closeModal, fireTelemetryEvent, currentSelectedItem, viewAll, navigate, removeQueryArgument],
  );

  const selectPrevious = useCallback(() => {
    let index = getIndexOfSelectedItem();
    if (index === 0) index = listCatalogItems?.length;
    setSelectedItemId(listCatalogItems?.[index - 1]?.uid);
    setSelectedItem(listCatalogItems?.[index - 1]);
  }, [listCatalogItems, getIndexOfSelectedItem]);

  const selectNext = useCallback(() => {
    const index = getIndexOfSelectedItem();
    setSelectedItemId(listCatalogItems?.[index + 1]?.uid);
    setSelectedItem(listCatalogItems?.[index + 1]);
  }, [listCatalogItems, getIndexOfSelectedItem]);

  const handleListChange = (i: number) => {
    setItems(i);
  };

  useEffect(() => {
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
        {catalogItems && currentSelectedItem && (
          <QuickSearchContent
            catalogItems={catalogItems}
            catalogItemTypes={catalogTypes}
            viewAll={viewAll}
            searchTerm={searchTerm}
            selectedItemId={currentSelectedItemId}
            closeModal={closeModal}
            selectedItem={currentSelectedItem}
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
