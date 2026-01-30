import type { ReactNode, FC, FormEvent } from 'react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { ModalBody, ModalHeader } from '@patternfly/react-core';
import { useNavigate } from 'react-router-dom-v5-compat';
import { CatalogItem } from '@console/dynamic-plugin-sdk';
import { useQueryParamsMutator } from '@console/internal/components/utils/router';
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
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>(null);
  const [catalogTypes, setCatalogTypes] = useState<CatalogType[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>(getQueryArgument('catalogSearch') || '');
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<CatalogItem>(null);
  const [viewAll, setViewAll] = useState<CatalogLinkData[]>(null);
  const [items, setItems] = useState<number>(limitItemCount);
  const ref = useRef<HTMLInputElement>();
  const fireTelemetryEvent = useTelemetry();
  const listCatalogItems = limitItemCount > 0 ? catalogItems?.slice(0, items) : catalogItems;

  useEffect(() => {
    if (searchTerm) {
      const { filteredItems, viewAllLinks, catalogItemTypes } = searchCatalog(searchTerm);
      setCatalogItems(filteredItems);
      setCatalogTypes(catalogItemTypes);
      setViewAll(viewAllLinks);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchCatalog]);

  useEffect(() => {
    if (catalogItems && !selectedItemId) {
      setSelectedItemId(catalogItems[0]?.uid);
      setSelectedItem(catalogItems[0]);
    }
  }, [catalogItems, selectedItemId]);

  const onSearch = useCallback(
    (_event: FormEvent<HTMLInputElement>, value: string) => {
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
    [searchCatalog, setQueryArgument, removeQueryArgument],
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
    () => listCatalogItems?.findIndex((item) => item.uid === selectedItemId),
    [listCatalogItems, selectedItemId],
  );

  const onEnter = useCallback(
    (e) => {
      const { id } = document.activeElement;
      const activeViewAllLink = viewAll?.find((link) => link.catalogType === id);
      if (activeViewAllLink) {
        navigate(activeViewAllLink.to);
      } else if (selectedItem) {
        handleCta(e, selectedItem, closeModal, fireTelemetryEvent, navigate, removeQueryArgument);
      }
    },
    [closeModal, fireTelemetryEvent, selectedItem, viewAll, navigate, removeQueryArgument],
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
